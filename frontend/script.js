import { postBook } from "./api.js"
import { loadBooks } from "./api.js"
import { editBook } from "./api.js"
import { delBook } from "./api.js"

// ++++++++++++++++++++++++++++++++++ GET +++++++++++++++++++++++
function showBooks(data) {
  const list = document.getElementById("booklist")
  list.innerHTML = ""
  data.forEach(book => {
    list.innerHTML += `
          <div>
            <h3>Book name : ${book.name}</h3>
            <div>Price : ${book.price}</div>
            <div>Author : ${book.author}</div>
            <div>Detail : ${book.detail}</div></br>
            <button data-id="${book.id}" class = "delBtn">Delete</button>
            <button data-id="${book.id}"
              data-name="${book.name}" data-price="${book.price}"
               class ="editBtn">Edit</button>
          </div>`
  });
  const buttonsDel = document.querySelectorAll(".delBtn")
  const buttonEdit = document.querySelectorAll(".editBtn")
  buttonsDel.forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id)
      delBook(id)
    })
  })
  buttonEdit.forEach(button => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id)
      const name = button.dataset.name
      const price = Number(button.dataset.price)
      console.log("Data >> ", id, name, price)

      const form = document.getElementById("EditForm")
      const edit1 = form.querySelector('[name="id"]')
      const edit2 = form.querySelector('[name="name"]')
      const edit3 = form.querySelector('[name="price"]')
      edit1.value = id
      edit2.value = name
      edit3.value = price
    })
  })
}
loadBooks()
    .then((data) => {
      console.log(data)
      showBooks(data)
    })

// +++++++++++++++++++++++++++++ POST +++++++++++++++++++++++++++++
document.getElementById("bookForm")
  .addEventListener("submit", (event) => {
    event.preventDefault()
    const input1 = document.querySelector('[name="name"]')
    const input2 = document.querySelector('[name="price"]')
    const input3 = document.querySelector('[name="author"]')
    const input4 = document.querySelector('[name="detail"]')
    const input5 = document.querySelector('[name="image"]')
    const image = input5 ? input5.files[0] : null
    const  name = input1.value
    const  price= Number(input2.value)
    const  author= input3.value
    const  detail= input4.value
    postBook(name, price, author, detail, image)
      .then((data) => {
        console.log(data)
        return loadBooks()
      })
      .then((data) => {
        showBooks(data)
      })
  })

//+++++++++++++++++++++++++++++ Edit +++++++++++++++++++++++++++++++++
document.getElementById("EditForm")
  .addEventListener("submit", (event) => {
    event.preventDefault()
    console.log("Edit submit")
    const form = event.currentTarget
    const input1 = form.querySelector('[name="id"]')
    const input2 = form.querySelector('[name="name"]')
    const input3 = form.querySelector('[name="price"]')
    const input4 = form.querySelector('[name="author"]')
    const input5 = form.querySelector('[name="detail"]')
    const input6 = form.querySelector('[name="image"]')
    const id = Number(input1.value)
    const name = input2.value
    const price = Number(input3.value)
    const author = input4.value
    const detail = input5.value
    const image = input6 ? input6.files[0] : null
    console.log(image)
    editBook(id, name, price, author, detail,image)
      .then((data) => {
        console.log(data)
        return loadBooks()
      })
      .then((data) => {
        showBooks(data)
      })
  })

//+++++++++++++++++++++++++DELETE+++++++++++++++++++++++++++++++
document.getElementById("delForm")
  .addEventListener("submit", (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const num1 = form.querySelector('[name="id"]')
    const id = Number(num1.value)
    delBook(id)
      .then((data) => {
        console.log(data)
        return loadBooks()
      })
      .then((data) => {
        showBooks(data)
      })
  })