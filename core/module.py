import time
import threading
import fields
import fields.io
import fields.persistant

def prop_field(field):
    def _prop_field(*args, **kwargs):
        if len(args) == 1 and not kwargs:
            return field.write(*args)
        elif not args:
            if not kwargs:
                return field.read()
            if len(kwargs) == 1 and 't' in kwargs:
                return field.read(**kwargs)
            if len(kwargs) == 2 and 'fr' in kwargs and 'to' in kwargs:
                return field.read(**kwargs)
        raise Exception
    return _prop_field

def read_field(field):
    def _read_field(**kwargs):
        return field.read(**kwargs)
    return _read_field

def write_field(field):
    def _write_field(value):
        return field.write(value)
    return _write_field

class ModuleMeta(type):
    ls_name = set()

    def __new__(cls, name, parents, attrs):
        return super(ModuleMeta, cls).__new__(cls, name, parents, attrs)

    def __call__(self, *args, **kwargs):
        obj = super(ModuleMeta, self).__call__(*args, **kwargs)
        cls = type(obj)

        # Handle module name
        if not hasattr(obj, 'module_name'):
            if not hasattr(cls, 'module_name'):
                setattr(obj, 'module_name', cls.__name__)
            else:
                setattr(obj, 'module_name', cls.module_name)

        if obj.module_name in type(self).ls_name:
            raise NameError('Module with same name already exist')
        type(self).ls_name.add(obj.module_name)

        # Handle module fields
        ls_fields = []
        for f_cls in cls.__dict__.keys():
            f_cls = getattr(cls, f_cls)
            if isinstance(f_cls, type) and issubclass(f_cls, fields.Base):
                field = f_cls()
                setattr(obj, field.field_name, prop_field(field))
                ls_fields += [field]
        setattr(obj, 'module_fields', ls_fields)

        return obj

class Base(threading.Thread):
    __metaclass__ = ModuleMeta

    def __init__(self, **kwargs):
        super(Base, self).__init__()
        self.running = False

        if 'name' in kwargs:
            self.module_name = kwargs['name']
        #module_fields = []

    def start(self):
        self.running = True
        for f in self.module_fields:
            f.start()
        super(Base, self).start()

    def run(self):
        while self.running:
            pass

    def stop(self):
        for f in self.module_fields:
            f.stop()
            f.join(1)
        self.running = False

if __name__ == '__main__':
    class M1(Base):
        class Field(fields.io.Readable,
                fields.io.Writable,
                fields.persistant.Volatile,
                fields.Base):
            field_name = 'mon_nom'

            def _acquire_value(self):
                return (int(time.time()) % 10) ** 2

        class F1(fields.io.Readable,
                fields.io.Writable,
                fields.persistant.Volatile,
                fields.Base):
            pass

    a = M1(name='M0')
    b = M1()
    print b.mon_nom()
    print b.mon_nom(10)
    print b.mon_nom()
    print b.mon_nom(t=time.time())
    print b.mon_nom(fr=time.time() - 5, to=time.time())
    for i in xrange(10):
        b.mon_nom(i)
        time.sleep(0.1)

    print b.mon_nom(fr=time.time() - 0.5, to=time.time())
    print b.mon_nom()
    print b.mon_nom(fr=time.time() - 0.5, to=time.time())

    print b.F1(10)
    print b.F1()

    print a.mon_nom(fr=0, to=time.time())
    b.start()
    try:
        while True:
            print b.mon_nom()
            time.sleep(0.4)
    except KeyboardInterrupt:
        b.stop()
        b.join(1)