from datetime import date, datetime, time

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from events.domain.entities import Event
from events.infrastructure.persistence import EventModel


def _to_entity(model: EventModel) -> Event:
    return Event(
        id=model.id,
        title=model.title,
        description=model.description,
        event_date=model.event_date,
        start_time=model.start_time,
        end_time=model.end_time,
        created_at=model.created_at,
        deleted_at=model.deleted_at,
    )


class SqlAlchemyEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_between(self, start: date, end: date) -> list[Event]:
        result = await self._session.scalars(
            select(EventModel)
            .where(
                EventModel.deleted_at.is_(None),
                EventModel.event_date >= start,
                EventModel.event_date <= end,
            )
            .order_by(
                EventModel.event_date,
                EventModel.start_time.asc().nulls_first(),
                EventModel.id,
            )
        )
        return [_to_entity(model) for model in result]

    async def get(self, event_id: int) -> Event | None:
        model = await self._session.get(EventModel, event_id)
        return _to_entity(model) if model is not None else None

    async def add(
        self,
        title: str,
        description: str | None,
        event_date: date,
        start_time: time | None,
        end_time: time | None,
    ) -> Event:
        model = EventModel(
            title=title,
            description=description,
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return _to_entity(model)

    async def save(self, event: Event) -> Event:
        model = await self._session.get_one(EventModel, event.id)
        model.title = event.title
        model.description = event.description
        model.event_date = event.event_date
        model.start_time = event.start_time
        model.end_time = event.end_time
        model.deleted_at = event.deleted_at
        await self._session.commit()
        return _to_entity(model)

    async def list_deleted(self) -> list[Event]:
        result = await self._session.scalars(
            select(EventModel)
            .where(EventModel.deleted_at.is_not(None))
            .order_by(EventModel.deleted_at.desc(), EventModel.id)
        )
        return [_to_entity(model) for model in result]

    async def purge(self, event_id: int) -> None:
        await self._session.execute(delete(EventModel).where(EventModel.id == event_id))
        await self._session.commit()

    async def purge_deleted_before(self, cutoff: datetime) -> int:
        result = await self._session.execute(
            delete(EventModel).where(EventModel.deleted_at < cutoff).returning(EventModel.id)
        )
        await self._session.commit()
        return len(result.all())
