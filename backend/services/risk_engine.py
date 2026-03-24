import re

def calculate_risk_score(port, banner="", data=""):
    """
    Calculate risk score based on the open port and banner/data information.
    Scale: 0-100
    - Critical: 90-100
    - High: 70-89
    - Medium: 40-69
    - Low: 10-39
    - Very Low: 0-9
    """
    base_score = 30
    
    if port == 23:
        base_score = 90
    elif port == 21:
        base_score = 80
    elif port in [22, 3389]:
        base_score = 60
    elif port == 80:
        base_score = 40
    elif port == 443:
        base_score = 10
        
    combined_banner = f"{banner} {data}".lower()
    
    risk_modifiers = 0
    if any(term in combined_banner for term in ['default password', 'unauthorized', 'admin:admin']):
        risk_modifiers += 30
    if any(term in combined_banner for term in ['vulnerable', 'exploit', 'cve-']):
        risk_modifiers += 40
    if 'anonymous user logged in' in combined_banner:
        risk_modifiers += 30
        
    if re.search(r'openssh [1-6]\.', combined_banner):
        risk_modifiers += 20
    if re.search(r'apache/[1-2]\.2', combined_banner):
        risk_modifiers += 15
        
    final_score = base_score + risk_modifiers
    
    if final_score > 100:
        return 100
    return final_score
