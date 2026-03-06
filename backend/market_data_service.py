
import time
import concurrent.futures

class MarketDataService:
    def __init__(self):
        # Mapeamento expandido para cobrir mais variações de nomes
        self.asset_map = {
            "EURUSD": "EURUSD", "GBPUSD": "GBPUSD", "USDJPY": "USDJPY", "EURJPY": "EURJPY",
            "AUDUSD": "AUDUSD", "USDCAD": "USDCAD", "EURGBP": "EURGBP", "GBPJPY": "GBPJPY",
            "NZDUSD": "NZDUSD", "USDCHF": "USDCHF", "AUDJPY": "AUDJPY", "GBPAUD": "GBPAUD",
            "EURUSDOTC": "EURUSD-OTC", "GBPUSDOTC": "GBPUSD-OTC", "USDJPYOTC": "USDJPY-OTC",
            "EURJPYOTC": "EURJPY-OTC", "AUDUSDOTC": "AUDUSD-OTC", "USDCADOTC": "USDCAD-OTC",
            "EURGBPOTC": "EURGBP-OTC", "GBPJPYOTC": "GBPJPY-OTC", "NZDUSDOTC": "NZDUSD-OTC"
        }

    def get_safe_assets(self):
        return list(self.asset_map.keys())

    def fetch_single_asset(self, api_instance, asset, period, count):
        """Busca dados de um único ativo de forma isolada."""
        try:
            clean_name = asset.replace("-", "").replace("/", "").upper()
            real_name = self.asset_map.get(clean_name, asset)
            
            # Tenta buscar. O iqoptionapi pode retornar False ou uma lista.
            candles = api_instance.get_candles(real_name, period, count, time.time())
            
            if isinstance(candles, list) and len(candles) > 0:
                return asset, [
                    {
                        "time": c['at'] * 1000,
                        "open": c['open'],
                        "close": c['close'],
                        "high": c['max'],
                        "low": c['min'],
                        "volume": c.get('volume', 0)
                    } for c in candles
                ]
        except Exception:
            pass
        return asset, []

    def fetch_batch_data(self, api_instance, assets):
        if not api_instance:
            return {asset: [] for asset in assets}

        results = {}
        # Usamos 10 threads para buscar os ativos em paralelo (Ultra-Fast)
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Mapeia as tarefas
            future_to_asset = {
                executor.submit(self.fetch_single_asset, api_instance, asset, 60, 20): asset 
                for asset in assets
            }
            
            for future in concurrent.futures.as_completed(future_to_asset):
                asset, data = future.result()
                results[asset] = data if data is not None else []
        
        return results
