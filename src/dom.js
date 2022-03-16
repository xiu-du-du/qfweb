window.dom={
    //创建元素
    create(string){
        const container=document.createElement('template');
        container.innerHTML=string.trim();
        return container.content.firstChild;
    },
    //加到节点后
    after(node,node2){
        node.parentNode.insertBefore(node2,node.nextSibling);
    },
    //加到节点前
    before(node,node2){
        node.parentNode.insertBefore(node2,node);
    },
    //加子节点
    append(parent,node){
        parent.appendChild(node)
    },
    //加父节点
    wrap(node,parent){
        dom.before(node,parent);
        dom.append(parent,node);
    },
    //删除节点
    remove(node){
        node.parentNode.removeChild(node)
        return node
    },
    //删除所有子节点
    empty(node){
        const {childNodes}=node
        const array=[]
        let x=node.firstChild
        while(x){
            array.push(dom.remove(node.firstChild));
            x=node.firstChild;
        }
        return array
    },
    //修改属性/读取属性
    attr(node,name,value){
        if(arguments.length===3){
            node.setAttribute(name,value)
        }else if(arguments.length===2){
            return node.getAttribute(name)
        }
    },
    //修改/读取文本内容(适配IE)
    text(node,string){
        if(arguments.length===2){
            if('innerText' in node){
                node.innerText=string//ie
            }else{
                node.textContext=string//fire fox/chrome
            }
        }else if(arguments.length===1){
            if('innerText' in node){
                return node.innerText
            }else{
                return node.textContext
            } 
        }
    },
    //修改/读取html内容
    html(node,string){
        if(arguments.length===2){
            node.innerHTML=string
        }else if(arguments.length===1){
            return node.innerHTML
        }
    },
    //修改/读取style样式
    style(node,name,value){
        if(arguments.length===3){
            //dom.style(div,'border','1px solid red')
            node.style[name]=value
        }else if(arguments.length===2){
            if(typeof name==="string"){
                //dom.style(div,'border')
                return node.style[name]
            }else if(name instanceof Object){
                //dom.style(div,{color:'red'})
                const object=name
                for(let key in object){
                    node.style[key]=object[key]
                }
            }
        }

    },
    class:{
        //新加类名
        add(node,className){
            node.classList.add(className)
        },
        //删除类名
        remove(node,className){
            node.classList.remove(className)
        },
        //查询类名是否存在
        has(node,className){
            return node.classList.contains(className)
        }
    },
    //监听事件
    on(node,eventName,fn){
        node.addEventListener(eventName,fn)
    },
    //删除事件
    off(node,eventName,fn){
        node.removeEventListener(eventName,fn)
    },
    find(selector,scope){
        return (scope||document).querySelectorAll(selector)
    },
    //找到父节点
    parent(node){
        return node.parentNode
    },
    //找到子节点
    children(node){
        return node.children
    },
    //找到同级节点
    siblings(node){
        return Array.from(node.parentNode.children).filter(n=>n!==node)
    },
    //找到同级的下个节点
    next(node){
        let x=node.nextSibling
        while(x && x.nodeType===3){
            x=x.nextSibling
        }
        return x
    },
    //找到同级的上个节点
    previous(node){
        let x=node.previousSibling
        while(x && x.nodeType===3){
            x=x.previousSibling
        }
        return x
    },
    //遍历每个节点列表的节点并修改
    each(nodeList,fn){
        for(let i=0;i<nodeList.length;i++){
            fn.call(null,nodeList[i])
        }
    },
    //判断节点排名第几
    index(node){
        const list=dom.children(node.parentNode)
        let i;
        for( i=0;i<list.length;i++){
            if(list[i]===node){
                break
            }
        }
        return i+1
    }
}