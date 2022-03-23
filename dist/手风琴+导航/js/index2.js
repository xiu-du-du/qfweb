const li=document.querySelectorAll("li")
const arr=['home','news','product','school','message','contact']
let temp=''
for(let i=0;i<li.length;i++){
    li[i].onmouseover=()=>{
        temp=li[i].innerText
        li[i].innerText=arr[i]
    }
    li[i].onmouseout=()=>{
        li[i].innerText=temp
    }
}

