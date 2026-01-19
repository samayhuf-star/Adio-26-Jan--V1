# Starting the Backend Server

## Quick Start

On macOS, use `python3` instead of `python`:

```bash
cd backend
source venv/bin/activate
python3 ad_generator_api.py
```

Or use the virtual environment's Python directly:

```bash
cd backend
./venv/bin/python3 ad_generator_api.py
```

## Alternative: Install Dependencies Globally

If you prefer not to use the virtual environment:

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 ad_generator_api.py
```

## Verify Server is Running

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy", "service": "ad_generator_fallback"}
```

