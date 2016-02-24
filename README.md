# es6bem
es6 i-bem implementation (with classes, w/o imports)

## DONE
* Скопировать основные части из файлов i-bem.js и i-bem__dom.js (объекты из decl'ов)
* Перегнать в es6-формат (убрать function'ы, обернуть в `class ... extends ... {}`, добавить `static`'и)
* Соединить всё вместе, проэкспортировать классы, унаследовать iBemDom <- iBem <- iObservable
* запустить, начать поиск недостающих фрагментов и багов
* добавить глобальные переменные
* добавить `this.__self`
* осознать что нужно сделать с `__base` (перегнать в `super.названиеМетода`)
* добавить `iBem` в `BEM`, и `iBemDom` в `BEM.DOM`
* заменить decl на примитивный es6decl,
  в котором, например, производится добавление блоков в `BEM.blocks`,
  который нужен, например, для инстанцирования бездомных блоков (`BEM.create`)
* починить `BEM.DOM.scope`
* починить `$('.preview2').bem('preview2')` и `initBlock`

## TODO
* понять, почему выстявляется `iBemDom#_params`, но не `params`
* ...
* дописать парсер для перегона `__base` в `super.названиеМетода` (*#конвертор_проекта*)
* ... починить сотни других багов ...
* понять, что делать с `decl({block, modName, modVal})`. пока есть лишь примерное понимание, как это будет работать
* понять, что делать с live секцией
* засунуть в конструктор `onSetMod.js`, написать *#конвертор_проекта*
* понять что делать с `onSetMod:{}`
* попробовать творение франкенштейна на сконверченных частях реального i-bem проекта
* ...
* ...
* ...
* померить производительность
* рассказать всем об успехе
* внедрить в продакшен 

## Resources
### Фрагменты для конвертора проекта 
#### `this.__base` -> `super.<method_name>`
##### 1. файлы прогоняются через `esprima`
См. [сокращённый пример одного estree файла](https://gist.github.com/a-x-/9ac7fa9f76cd07465f7e).

##### 2. над полученными `json-ast`-файлами запускается `jq`
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
  | ( ..
    | select(.type=="MethodDefinition")? | .. 
    | select(.type == "MemberExpression")? | .. 
    | select(.object.type == "ThisExpression")
    | .object.type
    ) = "Super" 
```

##### 3. модифицированные деревья через `escodegen` переводятся обратно в js 
