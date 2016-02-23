# Правила перегона объектов в es6-классы

## образец
BEM.DOM.decl({/*context section*/}, {/* static section */})

## контекстная секция
```js
/(\w+) : \s*function\s*(\([^(]*\))\s*({(.|\n)*?\}),$/g
'$1 $2 $3'
```

### конструктор
```js
/__conctructor/g
'conctructor'
```

## статическая секция
```js
/(\w+)\s*:\s*\s*function\s*(\([^(]*\))\s*({(.|\n)*?\}),$/g
'static $1 $2 $3'
```

### статические поля
```js
/^(    )(\w+)\s*:\s*(.+),/g
'$1static get $2 () { return $3 }'
```

## Общие изменения
this.__self
super