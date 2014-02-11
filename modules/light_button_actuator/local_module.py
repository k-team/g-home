import module
import fields
import fields.io
import fields.actuator

class LightActuator(module.Base):
    update_rate = 10

    class light_button(fields.actuator.LightButton, fields.io.Writable,
            fields.Base):
        pass