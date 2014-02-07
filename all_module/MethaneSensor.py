from twisted.internet import reactor
import core.module
import core.fields
import core.fields.io
import core.fields.persistant
import time

class MethaneSensor(core.module.Base):
    update_rate = 10
    class MethanePresence(
            core.fields.sensor.MethanePresence,
            core.fields.io.Readable,
            core.fields.Base):
        pass
