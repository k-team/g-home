import module
import fields
import fields.io
import fields.sensor
import fields.persistant
import fields.syntax

class COSensor(module.Base):
    update_rate = 10

    class value(fields.syntax.Numeric,
            fields.sensor.CO,
            fields.io.Readable,
            fields.persistant.Database,
            fields.Base):
        pass
