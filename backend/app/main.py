import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS
from app.database import init_db, get_connection
from app.routers import (
    health,
    overview,
    actuals,
    forecasts,
    accuracy,
    decision_replay,
    data_quality,
    export
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("windwise")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WINDWISE backend application...")
    init_db()
    # Check if database has records
    conn = get_connection()
    try:
        cur_act = conn.execute("SELECT COUNT(*) as cnt FROM actuals")
        act_cnt = cur_act.fetchone()["cnt"]
        cur_fc = conn.execute("SELECT COUNT(*) as cnt FROM forecasts")
        fc_cnt = cur_fc.fetchone()["cnt"]
        logger.info("Database status: %d actuals, %d forecasts cached", act_cnt, fc_cnt)
    finally:
        conn.close()
    yield
    logger.info("Shutting down WINDWISE backend application...")

app = FastAPI(
    title="WINDWISE – Renewable Forecast Intelligence Platform API",
    description="Backend API powering UK day-ahead wind power procurement analysis based on Elexon BMRS FUELHH and WINDFOR data streams.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local and deployed use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception at %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "path": request.url.path}
    )

# Register routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(actuals.router, prefix="/api")
app.include_router(forecasts.router, prefix="/api")
app.include_router(accuracy.router, prefix="/api")
app.include_router(decision_replay.router, prefix="/api")
app.include_router(data_quality.router, prefix="/api")
app.include_router(export.router, prefix="/api")

@app.get("/")
def root():
    return {
        "platform": "WINDWISE – Renewable Forecast Intelligence Platform",
        "evaluation_period": "January 1-31, 2026",
        "datasets": ["Elexon FUELHH (fuelType=WIND)", "Elexon WINDFOR"],
        "docs_url": "/docs",
        "api_prefix": "/api"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
