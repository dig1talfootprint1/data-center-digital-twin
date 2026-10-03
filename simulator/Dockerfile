FROM python:3.14-slim

WORKDIR /app

COPY simulator/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY simulator/ ./simulator/
COPY database/ ./database/

CMD ["python", "-m", "simulator.simulator"]