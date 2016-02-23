# Несовместимость
## __base
нет this.__base, т.к. нельзя пользоваться this.super[argument.callee.name]
альтернатива:
this.super.methodName // insert actual method's name instead of methodName