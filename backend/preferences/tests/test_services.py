import pytest
from pydantic import ValidationError

from preferences.application.dtos import PreferencesUpdate
from preferences.application.services import PreferencesService


async def test_defaults_to_thirty_day_trash_retention(service: PreferencesService) -> None:
    assert (await service.get_preferences()).trash_retention_days == 30


async def test_update_persists_provided_fields_only(service: PreferencesService) -> None:
    await service.update_preferences(PreferencesUpdate(trash_retention_days=7))

    unchanged = await service.update_preferences(PreferencesUpdate())

    assert unchanged.trash_retention_days == 7
    assert (await service.get_preferences()).trash_retention_days == 7


@pytest.mark.parametrize("days", [0, 366])
def test_retention_outside_one_to_365_days_is_rejected(days: int) -> None:
    with pytest.raises(ValidationError):
        PreferencesUpdate(trash_retention_days=days)
