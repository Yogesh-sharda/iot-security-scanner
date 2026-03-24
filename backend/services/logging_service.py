import logging
from logging.handlers import RotatingFileHandler
import os

def setup_logging(app):
    log_dir = os.path.join(app.root_path, 'logs')
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    app_log_file = os.path.join(log_dir, 'app.log')
    app_handler = RotatingFileHandler(app_log_file, maxBytes=1048576, backupCount=5)
    app_handler.setLevel(logging.INFO)
    app_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    app_handler.setFormatter(app_formatter)
    app.logger.addHandler(app_handler)

    werkzeug_logger = logging.getLogger('werkzeug')
    werkzeug_logger.addHandler(app_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('System Startup: Logging Initialized')
