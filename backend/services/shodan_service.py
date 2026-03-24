import shodan
from config import Config
from flask import current_app
import time

class ShodanService:
    def __init__(self):
        self.api_key = Config.SHODAN_API_KEY
        self.api = shodan.Shodan(self.api_key) if self.api_key else None

    def search(self, query):
        if not self.api:
            current_app.logger.error("Shodan API key is missing. Cannot perform scan.")
            raise Exception("SHODAN_API_KEY is not configured on the server.")
            
        try:
            current_app.logger.info(f"Initiating Shodan query: {query}")
            start_time = time.time()
            results = self.api.search(query)
            elapsed = time.time() - start_time
            current_app.logger.info(f"Shodan query '{query}' completed in {elapsed:.2f}s with {results.get('total', 0)} hits.")
            return results
        except shodan.APIError as e:
            current_app.logger.error(f"Shodan API Error for query '{query}': {e}")
            if 'rate limit' in str(e).lower():
                raise Exception("Shodan API rate limit reached. Please try again later.")
            elif 'invalid key' in str(e).lower():
                raise Exception("Invalid Shodan API key.")
            else:
                raise Exception(f"Shodan Error: {e}")
        except Exception as e:
            current_app.logger.error(f"Unexpected error during Shodan search: {e}")
            raise Exception("An unexpected error occurred while communicating with Shodan.")
