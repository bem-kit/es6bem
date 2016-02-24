# Правила перегона объектов в es6-классы

## образец
BEM.DOM.decl({/*context section*/}, {/* static section */})

## контекстная секция
```js
/(\w+)\s*:\s*function\s*(\([^(]*\))\s*({(.|\n)*?\}),$/g
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
### __self
this.__self
super

### __base
esprima
    player: http://esprima.org/demo/parse.html
    doc: http://esprima.org/doc/index.html 
    escodegen: escodegen.generate(esprima.parse('/*...js...*/'));
jq
    player: https://jqplay.org
    doc: https://stedolan.github.io/jq/manual/#Advancedfeatures

estree: libs/aux/i-bem.class.tree.json

заменять
```js
{
  "type": "MemberExpression",
  "computed": false,
  "object": {
    "type": "ThisExpression"
  },
  "property": {
    "type": "Identifier",
    "name": "__base"
  }
}
```
на
```js
{
    "type": "MemberExpression",
    "computed": false,
    "object": {
        "type": "Super" ///< ThisExpression -> Super
    },
    "property": {
        "type": "Identifier",
        "name": "${ METHOD_NAME }" ///<
    }
}
```


**alpha** находить имена функций и все obj.method внутри
[..|select(.type=="MethodDefinition")? | { name: .key.name, __baseExpr: (..|select(.type == "MemberExpression")?) }]

**alpha** находить имена функций и все this.__base внутри
[..|select(.type=="MethodDefinition")? | { name: .key.name, __baseExpr: (..|select(.type == "MemberExpression")? | select(.property.name == "__base")) }]

**alpha** замена __base на "$method_name" без схлопывания до эндпоинтов
( .. | select(.type=="MethodDefinition")? | .. | select(.type == "MemberExpression")? | .. | select(.property.name == "__base")  | .property.name ) |= "$method_name" 

**done** замена __base на $method_name без схлопывания до эндпоинтов
def walk(f): . as $in | if type == "object" then reduce keys[] as $key ( {}; . + { ($key): ($in[$key] | walk(f)) } ) | f elif type == "array" then map( walk(f) ) | f else f end;
walk(if (.type?//"") == "MethodDefinition" then ( . as $md | .key.name as $mn | $md
    | walk(if (.type?//"") == "MemberExpression" then (
        if .property.name == "__base" then . as $mem | .property.name |= $mn else . end
    ) else . end)
) else . end)


**done** замена this на super без схлопывания до эндпоинтов 
( .. | select(.type=="MethodDefinition")? | .. | select(.type == "MemberExpression")? | .. | select(.object.type == "ThisExpression")  |  .object.type ) = "Super" 

**DONE** `this.__base` -> `super.<method_name>`
```jq
def walk(f): . as $in | if type == "object" then reduce keys[] as $key ( {}; . + { ($key): ($in[$key] | walk(f)) } ) | f elif type == "array" then map( walk(f) ) | f else f end;
.
  | walk(
    if (.type?//"")=="MethodDefinition" then (
      . as $md | .key.name as $mn | $md
      | walk(if (.type?//"") == "MemberExpression" then (
          if .property.name == "__base"
          then . as $mem | .property.name |= $mn
          else . end
      ) else . end)
    ) else . end
  )
  | ( .. | select(.type=="MethodDefinition")? | .. | select(.type == "MemberExpression")? | .. | select(.object.type == "ThisExpression")  |  .object.type ) = "Super" 
```

**TODO** подумать так же про
this
    .__base.apply(...)
    .foo()
