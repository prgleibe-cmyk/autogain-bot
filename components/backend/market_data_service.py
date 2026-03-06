import time
import sys


class MarketDataService:
    def __init__(self):
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
        try:
            clean_name = asset.replace("-", "").replace("/", "").upper()
            real_name = self.asset_map.get(clean_name, asset)

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

        except Exception as e:
            sys.stderr.write(f"[MarketData] Error {asset}: {e}\n")

        return asset, None

    def fetch_batch_data(self, api_instance, assets):
        if not api_instance:
            return {}

        # Segurança extra para evitar chamada com websocket inválido
        if not hasattr(api_instance, 'websocket') or api_instance.websocket is None:
            sys.stderr.write("[MarketData] Websocket is None, skipping batch.\n")
            return {}

        results = {}

        # 🔥 MODO SEQUENCIAL (um por vez)
        for asset in assets:
            asset_name, data = self.fetch_single_asset(api_instance, asset, 60, 20)

            if data:
                results[asset_name] = data

            # Pequeno delay para evitar flood no websocket
            time.sleep(0.2)

        return results