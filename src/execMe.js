import docs from '-!raw-loader!all:document'

docs.forEach(x => console.log(PARTS_COMPATIBILITY.all_onlyDefaultWhenEsModule ? x : x.default))
