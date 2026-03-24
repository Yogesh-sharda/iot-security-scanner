from marshmallow import Schema, fields, validate

class RegisterSchema(Schema):
    username = fields.String(required=True, validate=validate.Length(min=3, max=30))
    password = fields.String(required=True, validate=validate.Length(min=6))
    role = fields.String(validate=validate.OneOf(["Admin", "Analyst"]), missing="Analyst")

class LoginSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True)

class ScanSchema(Schema):
    query = fields.String(required=True, validate=validate.Length(min=2, max=255))
