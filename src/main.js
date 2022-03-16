const div=dom.create('<div>2</div>');
console.log(div);

dom.after(test,div);

const div3=dom.create('<div id="parent">3</div>')
dom.wrap(div,div3);
console.log(div3);

// const nodes=dom.empty(window.empty)
// console.log(nodes)

dom.attr(test,"title","hello")
const title=dom.attr(test,"title")
console.log(title)

dom.text(aa,"newText")

dom.style(test,{border:'3px solid green',color:'red'})
console.log(dom.style(test,'border'))
dom.style(test,'border','1px solid blue')

dom.class.add(test,"yy")
dom.class.add(test,"xx")
dom.class.remove(test,"yy")
console.log(dom.class.has(test,"xx"))

const fn=()=>{console.log("ok")}
dom.on(test,'click',fn)
dom.off(test,'click',fn)

console.log(dom.find("#aa",dom.find('#test')[0])[0])

const x=dom.find("#s2")[0]
console.log(dom.siblings(x))
console.log(dom.next(x))
console.log(dom.previous(x))

const t=dom.find("#ac")[0]
dom.each(dom.children(t),(n)=>dom.style(n,'color','pink'))

console.log("排名第:"+dom.index(s2))
