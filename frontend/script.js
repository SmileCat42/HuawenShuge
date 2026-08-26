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
    const data = {
      name: input1.value,
      price: Number(input2.value)
    }
    postBook(data)
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
    const form = event.currentTarget
    const input1 = form.querySelector('[name="id"]')
    const input2 = form.querySelector('[name="name"]')
    const input3 = form.querySelector('[name="price"]')
    const id = Number(input1.value)
    const name = input2.value
    const price = Number(input3.value)
    editBook(id, name, price)
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