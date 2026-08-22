import { createServer } from "http";

const book = [
                {id:1, name:"AAA", price:200},
                {id:2, name:"BBB", price:300},
                {id:3, name:"CCC", price:400}
            ]

const server = createServer(
    (req,res) => {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")

        if (req.method === "OPTIONS") {
            res.statusCode = 204
            res.end()
            return
        }

        const parts = (req.url ?? "/").split("/") //?? เช็คว่าว่างไหม เพราะถ้าไม่ทำ ts มันจะฟ้อง
    
        if(req.method === "GET" && parts[1] === "book"){
            if(parts[2]){
                console.log("GET >> ", parts[1], " ID: ", parts[2])
                const id = Number(parts[2])
                if(Number.isNaN(id)){ //ควรตรวจสอบกรณีที่ไม่ได้ส่งมาเป็นเลข เช่น book/abc
                    res.statusCode = 400
                    res.end("Invalid Book id :(")
                    return
                }
                const show = book.find((book) => book.id === id)
                if(!show){ //จากเดิมเราใช้ show === null เพื่อดูว่าค่าว่างไหม แต่ ts เรื่องเยอะ เขาคำนึงถึง undefine ด้วย ซึ่งเป็นคนละเคส จึงต้องใช้ !show เพื่อตรวจสอบทั้ง null และ undefine
                    res.statusCode = 404
                    res.end("No data")
                    return
                }
                res.end(`Name : ${show.name}  Price : ${show.price}`)
                return
            }else{
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(book))
                return
            }
        }

        if(req.method === "POST" && parts[1] === "book"){
            console.log("POST >> recieved")
            let body = ""
            req.on("data", (chunk) => {
                body += chunk
            })
            req.on("end", () => {
                let obj
                console.log("Body: ", body)
                try{
                    obj = JSON.parse(body)
                }catch(error){
                    res.end("Invalid JSON")
                    return
                }    
                if(!obj.name || !obj.price){
                    res.end("Invalid data")
                    return
                }
                if(typeof obj.name !== "string" || typeof obj.price !== "number"){
                    res.end("Wrong type data")
                    return
                }
                if(obj.name === "" || obj.price <= 0){
                    res.end("Please fill data or price more than 0")
                    return
                }
                let maxid = 0
                for(let i=0; i<book.length;i++){
                    const run2 = book[i]!
                    if(run2.id > maxid){
                        maxid = run2.id
                    }
                }
                obj.id = maxid+1
                book.push(obj)
                const show2 = JSON.stringify(obj)
                res.end(show2)
            })
            return
        }

        if(req.method === "PUT" && parts[1] === "book"){
            if(!parts[2]){
                res.end("Pls take more detail")
                return
            }
            const id = Number(parts[2])
            if(Number.isNaN(id)){
                res.end("Error type")
                return
            }
            console.log("PUT >> recieved ID = ", id)
            const show = book.find((book) => id === book.id)
            if(!show){
                res.statusCode = 404
                res.end("No data")
                return
            }

            let body =""
            req.on("data", (chunk) => {
                body += chunk
            })
            req.on("end", () => {
                console.log("Body = ", body)
                let obj
                try{
                    obj = JSON.parse(body)
                }catch{
                    res.end("Invalid data")
                    return
                }
                if(!obj.name || !obj.price){
                    res.end("Pls fill detail")
                    return
                }
                if(obj.name !== "string" || obj.price !== "number"){
                    res.end("Wrong type detail")
                    return
                }
                if(obj.name === "" || !obj.price){
                    res.end("Pls fill detail")
                    return
                }
                if(obj.price <=0){
                    res.end("Pls take price more than 0")
                    return
                }
                show.name = obj.name
                show.price = obj.price
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(show))
                return
            })
        }
        res.end("++ HOME PAGE ++")
    }
)
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});