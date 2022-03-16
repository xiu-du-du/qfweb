# 自用封装dom库 —— by.飞溟
### 引入
```javascript
    <script src="https://www.akk8.xyz/fmAPI/fm-dom.min.js"></script>
```
### 说明
```javascript
    // 操作节点
    create(string)  //创建元素
    after(node,c_node)  //加到节点后
    before(node,c_node) //加到节点前
    append(parent,node) //加子节点
    wrap(node,parent)   //加父节点
    remove(node)    //删除一个节点
    empty(node) //删除所有子节点
    attr(node,name,value)   //3个参数修改属性/2个参数读取属性
    text(node,string)  //2个参数修改文本内容/1个参数读取文本内容(已兼容ie)
    html(node,string)  //2个参数修改html内容/1个参数读取html内容
    style(node,name,value)  //3个参数修改修改样式/2个参数读取样式

    // 类
    add(node,className) //新加类名
    remove(node,className)  //删除类名
    has(node,className) //查询类名是否存在

    // 事件
    on(node,eventName,fn)   //监听事件
    off(node,eventName,fn)  //删除事件

    // 查找
    find(selector,scope)    //在...中查找...标签
    parent(node)    //找父节点
    children(node)  //找子节点
    siblings(node)  //找同级节点
    next(node)  //找到同级的下个节点
    previous(node)  //找到同级的上个节点
    each(nodeList,fn)   //遍历每个节点列表的节点，并修改
    index(node) //判断节点排名
```
### 版本号：wqzy-fm-20220316v
