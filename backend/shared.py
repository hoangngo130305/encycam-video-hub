from ninja import Schema
from pydantic import ConfigDict, AliasGenerator
from pydantic.alias_generators import to_snake


class BaseSchema(Schema):
    """Base schema — field names dùng camelCase trực tiếp.
    AliasGenerator(validation_alias=to_snake) cho phép model_validate từ ORM/dict có key snake_case.
    model_dump() trả về camelCase vì field name là camelCase."""
    model_config = ConfigDict(
        alias_generator=AliasGenerator(validation_alias=to_snake),
        populate_by_name=True,
        from_attributes=True,
    )
