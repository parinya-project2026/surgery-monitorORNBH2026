# Import all routers
from app.routers.auth import router as auth_router
from app.routers.patients import router as patients_router
from app.routers.users import router as users_router
from app.routers.import_data import router as import_router

__all__ = [
    "auth_router",
    "patients_router",
    "users_router",
    "import_router",
]
