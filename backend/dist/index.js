import { createServer } from "http";
const book = [
    { id: 1, name: "AAA", price: 200 },
    { id: 2, name: "BBB", price: 300 },
    { id: 3, name: "CCC", price: 400 }
];
const server = createServer((req, res) => {
    const parts = (req.url ?? "/").split("/"); //?? เช็คว่าว่างไหม เพราะถ้าไม่ทำ ts มันจะฟ้อง
    if (req.method === "GET" && parts[1] === "book") {
        if (parts[2]) {
            console.log("GET >> ", parts[1], " ID: ", parts[2]);
            const id = Number(parts[2]);
            if (Number.isNaN(id)) { //ควรตรวจสอบกรณีที่ไม่ได้ส่งมาเป็นเลข เช่น book/abc
                res.statusCode = 400;
                res.end("Invalid Book id :(");
                return;
            }
            const show = book.find((book) => book.id === id);
            if (!show) { //จากเดิมเราใช้ show === null เพื่อดูว่าค่าว่างไหม แต่ ts เรื่องเยอะ เขาคำนึงถึง undefine ด้วย ซึ่งเป็นคนละเคส จึงต้องใช้ !show เพื่อตรวจสอบทั้ง null และ undefine
                res.statusCode = 404;
                res.end("No data");
                return;
            }
            res.end(`Name : ${show.name}  Price : ${show.price}`);
            return;
        }
        else {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(book));
            return;
        }
        /*let show = null;
        for(let i=0;i<book.length;i++){
            const run = book[i]
            if(run && run.id === id){ //จากเดิมใช้ if(book[i] && book[i].id === id) >> ts เรื่องมากอีก เพราะกลัวค่าว่าง ต่อให้ดักด้วย if book[i] แล้วก็ยังกลัว book[i].id ว่างอีก เลยต้องสร้าง run มาคอยรับค่าชั่วคราวแทน อื้อ กูยอมเองก็ได้ 555
                show = run
                break
            }
        }*/
    }
    if (req.method === "POST" && parts[1] === "book") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", () => {
            const obj = JSON.parse(body);
            book.push(obj);
            const show2 = JSON.stringify(obj);
            res.end(show2);
        });
        return;
    }
    res.end("++ HOME PAGE ++");
});
server.listen(3000);
//# sourceMappingURL=index.js.map