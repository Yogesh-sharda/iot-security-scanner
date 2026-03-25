from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Scan, Result
from services.shodan_service import ShodanService
from services.risk_engine import calculate_risk_score
from utils.validators import ScanSchema
from marshmallow import ValidationError
from utils.extensions import limiter
import concurrent.futures

scan_bp = Blueprint('scan', __name__)
shodan_service = ShodanService()
scan_schema = ScanSchema()

scan_executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

def perform_shodan_scan(query: str) -> dict:
    return shodan_service.search(query)

@scan_bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
@limiter.limit("10 per minute")
def run_scan():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    current_user = get_jwt_identity()
    user_id = current_user['id']
    
    data = request.get_json()
    try:
        validated_data = scan_schema.load(data)
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    query = validated_data['query']

    try:
        current_app.logger.info(f"Dispatching threaded scan for query '{query}' by user {current_user['username']}")
        future = scan_executor.submit(perform_shodan_scan, query)  # type: ignore
        
        shodan_results = future.result(timeout=15)
        
        matches = shodan_results.get('matches', [])

        new_scan = Scan(user_id=user_id, query=query)
        db.session.add(new_scan)
        db.session.flush()

        scan_id = new_scan.id
        results_data = []

        for match in matches:
            port = match.get('port', 0)
            banner = match.get('banner', '')
            data_str = match.get('data', '')
            risk_score = calculate_risk_score(port, banner, data_str)
            
            location = match.get('location', {})
            country = location.get('country_name', 'Unknown')
            org = match.get('org', 'Unknown')
            if org is None: org = 'Unknown'
            
            result = Result(
                scan_id=scan_id,
                ip_str=match.get('ip_str', 'Unknown'),
                port=port,
                org=org,
                country=country,
                risk_score=risk_score
            )
            db.session.add(result)
            results_data.append({
                "ip_str": result.ip_str,
                "port": result.port,
                "org": result.org,
                "country": result.country,
                "risk_score": risk_score
            })

        db.session.commit()
        current_app.logger.info(f"User {current_user['username']} scanned '{query}' and got {len(results_data)} results.")
        return jsonify({
            "msg": "Scan completed successfully", 
            "scan_id": scan_id, 
            "results": results_data,
            "total_shodan_matches": shodan_results.get('total', len(results_data))
        }), 201

    except concurrent.futures.TimeoutError:
        current_app.logger.warning(f"Scan timeout for query: {query}")
        return jsonify({"error": "Scan timed out. Shodan API is slow."}), 504
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Scan error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@scan_bp.route('/history', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_scan_history():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    current_user = get_jwt_identity()
    user_id = current_user['id']
    role = current_user['role']
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 20, type=int)

    if role == 'Admin':
        scans_query = db.select(Scan).order_by(Scan.timestamp.desc())
    else:
        scans_query = db.select(Scan).filter_by(user_id=user_id).order_by(Scan.timestamp.desc())

    paginated_scans = db.paginate(scans_query, page=page, per_page=per_page, error_out=False)

    history = []
    for scan in paginated_scans.items:
        history.append({
            "id": scan.id,
            "query": scan.query,
            "timestamp": scan.timestamp.isoformat(),
            "user": scan.user.username
        })

    return jsonify({
        "items": history,
        "total": paginated_scans.total,
        "pages": paginated_scans.pages,
        "current_page": page
    }), 200

@scan_bp.route('/<int:scan_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_scan_results(scan_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    current_user = get_jwt_identity()
    user_id = current_user['id']
    role = current_user['role']

    scan = Scan.query.get_or_404(scan_id)
    
    if role != 'Admin' and scan.user_id != user_id:
        return jsonify({"error": "Unauthorized access to this scan"}), 403

    results = []
    for r in scan.results:
        results.append({
            "id": r.id,
            "ip_str": r.ip_str,
            "port": r.port,
            "org": r.org,
            "country": r.country,
            "risk_score": r.risk_score
        })

    return jsonify({
        "scan_id": scan.id,
        "query": scan.query,
        "timestamp": scan.timestamp.isoformat(),
        "results": results
    }), 200
