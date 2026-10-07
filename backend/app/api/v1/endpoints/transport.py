from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.domain import RouteStop, StudentTransport, TransportRoute, User, Vehicle
from app.schemas.domain import (
    RouteStopCreate,
    RouteStopOut,
    StudentTransportCreate,
    StudentTransportOut,
    TransportRouteCreate,
    TransportRouteOut,
    TransportRouteUpdate,
    VehicleCreate,
    VehicleOut,
    VehicleUpdate,
)

router = APIRouter()


# --- Vehicles ---
@router.get("/vehicles", response_model=List[VehicleOut])
async def list_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    res = await db.execute(select(Vehicle))
    return res.scalars().all()


@router.post("/vehicles", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    vehicle = Vehicle(
        vehicle_number=vehicle_in.vehicle_number,
        registration_number=vehicle_in.registration_number,
        capacity=vehicle_in.capacity,
        driver_name=vehicle_in.driver_name,
        driver_phone=vehicle_in.driver_phone,
        status=vehicle_in.status,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.put("/vehicles/{vehicle_id}", response_model=VehicleOut)
async def update_vehicle(
    vehicle_id: str,
    vehicle_in: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    v = (await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    for field, val in vehicle_in.model_dump(exclude_unset=True).items():
        setattr(v, field, val)

    await db.commit()
    await db.refresh(v)
    return v


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    v = (await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    await db.delete(v)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Routes & Stops ---
@router.get("/routes", response_model=List[TransportRouteOut])
async def list_routes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    res = await db.execute(select(TransportRoute))
    return res.scalars().all()


@router.post("/routes", response_model=TransportRouteOut, status_code=status.HTTP_201_CREATED)
async def create_route(
    route_in: TransportRouteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    route = TransportRoute(
        route_name=route_in.route_name,
        vehicle_id=route_in.vehicle_id,
        start_location=route_in.start_location,
        end_location=route_in.end_location,
        fare=route_in.fare,
    )
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return route


@router.put("/routes/{route_id}", response_model=TransportRouteOut)
async def update_route(
    route_id: str,
    route_in: TransportRouteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    r = (await db.execute(select(TransportRoute).where(TransportRoute.id == route_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Route not found")

    for field, val in route_in.model_dump(exclude_unset=True).items():
        setattr(r, field, val)

    await db.commit()
    await db.refresh(r)
    return r


@router.delete("/routes/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = (await db.execute(select(TransportRoute).where(TransportRoute.id == route_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Route not found")
    await db.delete(r)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post("/routes/{route_id}/stops", response_model=RouteStopOut, status_code=status.HTTP_201_CREATED)
async def add_route_stop(
    route_id: str,
    stop_in: RouteStopCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stop = RouteStop(
        route_id=route_id,
        stop_name=stop_in.stop_name,
        pickup_time=stop_in.pickup_time,
        drop_time=stop_in.drop_time,
        stop_order=stop_in.stop_order,
    )
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return stop


# --- Student Transport Assignments ---
@router.get("/assignments", response_model=List[StudentTransportOut])
async def list_student_transports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    res = await db.execute(select(StudentTransport))
    return res.scalars().all()


@router.post("/assignments", response_model=StudentTransportOut, status_code=status.HTTP_201_CREATED)
async def assign_student_transport(
    assign_in: StudentTransportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    assignment = StudentTransport(
        student_id=assign_in.student_id,
        route_id=assign_in.route_id,
        stop_id=assign_in.stop_id,
        pickup_point=assign_in.pickup_point,
        drop_point=assign_in.drop_point,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment
