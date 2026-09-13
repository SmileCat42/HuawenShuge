import { postBook } from "./api.js"
import { loadBooks } from "./api.js"
import { editBook } from "./api.js"
import { delBook } from "./api.js"
import {
  createOrder,
  getOrder,
  getUnassignedOrders,
  assignOrder,
  updateOrderStatus,
  getEmployeeOrders
} from "./api.js"

let cart = []

// ++++++++++++++++++++++++++++++++++ GET +++++++++++++++++++++++
function showBooks(data) {

  const list = document.getElementById("booklist")

  list.innerHTML = ""

  data.forEach(book => {

    list.innerHTML += `
      <div>

        <img
          src="${book.image}"
          alt="${book.name}"
          style="width:150px; height:auto;"
        />

        <h3>Book name : ${book.name}</h3>

        <div>Price : ${book.price}</div>

        <div>Author : ${book.author}</div>

        <div>Detail : ${book.detail}</div>

        <br>

        <input
          type="number"
          min="1"
          value="1"
          class="qtyInput"
          data-id="${book.id}"
        >

        <button
          class="addCartBtn"
          data-id="${book.id}">
          Add to Order
        </button>

        <button
          data-id="${book.id}"
          class="delBtn">
          Delete
        </button>

        <button
          data-id="${book.id}"
          data-name="${book.name}"
          data-price="${book.price}"
          class="editBtn">
          Edit
        </button>

      </div>
    `
  })

  const buttonsDel = document.querySelectorAll(".delBtn")
  const buttonEdit = document.querySelectorAll(".editBtn")
  const buttonsAddCart = document.querySelectorAll(".addCartBtn")


  buttonsAddCart.forEach(button => {

    button.addEventListener("click", () => {

      console.log("Button cart work on >>")

      const id = Number(button.dataset.id)

      const input = document.querySelector(
        `.qtyInput[data-id="${id}"]`
      )

      const quantity = Number(input.value)

      if (quantity <= 0 || Number.isNaN(quantity)) {
        alert("Invalid quantity")
        return
      }

      addCart(id, quantity)

    })
  })


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
} loadBooks()
  .then((data) => {
    console.log(data)
    showBooks(data)
  })

function showCart() {

  const cartList = document.getElementById("cartList")

  cartList.innerHTML = ""

  cart.forEach(item => {

    cartList.innerHTML += `
            <div>
                Product ID: ${item.id_product}
                <br>
                Quantity: ${item.quantity}
            </div>
        `
  })
}

function showOrder(order) {

  const orderResult =
    document.getElementById("orderResult")
  console.log("Show order >>", order)
  orderResult.innerHTML = `
        <h2>Order #${order.id_order}</h2>

        <div>Customer: ${order.id_cust}</div>
        <div>Status: ${order.status}</div>
        <br>
  
        ${order.items.map(item => `
            <div>
                ${item.product_name}
                × ${item.quantity}
                = ${item.subtotal} บาท
            </div>
        `).join("")}

        <h3>Total: ${order.total} บาท</h3>
    `
}

function showEmployeeOrders(data) {

  const list =
    document.getElementById("employeeOrderList")

  list.innerHTML = ""

  data.forEach(order => {

    list.innerHTML += `
      <div>

        <h3>Order #${order.id_order}</h3>

        <div>
          Customer: ${order.id_cust}
        </div>

        <div>
          Total: ${order.total} บาท
        </div>

        <div>
          Status: ${order.status}
        </div>

        <button
          class="assignOrderBtn"
          data-id="${order.id_order}">
          รับ Order
        </button>

        <button
    class="statusBtn"
    data-id="${order.id_order}"
    data-status="SHIPPED">
    Mark Shipped
</button>

      </div>
    `
  })

  document
    .querySelectorAll(".assignOrderBtn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id_order =
          Number(button.dataset.id)

        assignOrder(id_order, 3201)
          .then(data => {

            console.log("Assigned >>", data)

            return Promise.all([
              getUnassignedOrders(),
              getEmployeeOrders(3201)
            ])

          })
          .then(([unassigned, myOrders]) => {

            showEmployeeOrders(unassigned)
            showMyOrders(myOrders)

          })
      })
    })
}

getUnassignedOrders()
  .then(data => {
    showEmployeeOrders(data)
  })
  .catch(error => {
    console.error(error)
  })

function showMyOrders(data) {

  const list =
    document.getElementById("myOrderList")

  list.innerHTML = ""

  data.forEach(order => {

    let button = ""

    if (order.status === "PROCESSING") {

      button = `
                <button
                    class="statusBtn"
                    data-id="${order.id_order}"
                    data-status="PAID">
                    Mark as PAID
                </button>
            `

    } else if (order.status === "PAID") {

      button = `
                <button
                    class="statusBtn"
                    data-id="${order.id_order}"
                    data-status="SHIPPED">
                    Mark as SHIPPED
                </button>
            `

    } else if (order.status === "SHIPPED") {

      button = `
                <button
                    class="statusBtn"
                    data-id="${order.id_order}"
                    data-status="DELIVERED">
                    Mark as DELIVERED
                </button>
            `
    }

    list.innerHTML += `
            <div>

                <h3>
                    Order #${order.id_order}
                </h3>

                <div>
                    Customer: ${order.id_cust}
                </div>

                <div>
                    Total: ${order.total} บาท
                </div>

                <div>
                    Status: ${order.status}
                </div>

                <button
  class="viewOrderBtn"
  data-id="${order.id_order}">
  View Detail
</button>

                ${button}

                

            </div>
        `
  })

  document
  .querySelectorAll(".viewOrderBtn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const id_order =
        Number(button.dataset.id)

      getOrder(id_order)
        .then(order => {

          console.log("Order detail >>", order)

          showOrderDetail(order)

        })
        .catch(error => {

          console.error(error)

          alert("Cannot get order detail")

        })
    })
  })

  document
    .querySelectorAll(".statusBtn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id_order =
          Number(button.dataset.id)

        const status =
          button.dataset.status

        updateOrderStatus(
          id_order,
          status
        )
          .then(data => {

            console.log(
              "Updated >>",
              data
            )

            return getEmployeeOrders(3201)
          })
          .then(data => {

            showMyOrders(data)

          })
          .catch(error => {

            console.error(error)

            alert(error.message)
          })
      })
    })
}

getEmployeeOrders(3201)
  .then(data => {

    console.log("My orders >>", data)

    showMyOrders(data)

  })
  .catch(error => {

    console.error(error)

  })

  function showOrderDetail(order) {
    console.log("show order detail >> ", order)
  const detail =
    document.getElementById("employeeOrderDetail")

  detail.innerHTML = `
    <div>

      <h2>
        Order #${order.id_order}
      </h2>

      <div>
        Customer: ${order.id_cust}
      </div>

      <div>
        Employee: ${order.id_emp ?? "Not assigned"}
      </div>

      <div>
        Status: ${order.status}
      </div>

      <div>
        Order Date: ${order.order_date}
      </div>

      <hr>

      <h3>Items</h3>

      ${order.items.map(item => `
        <div>

          ${item.name}

          × ${item.quantity}

          × ${item.price} บาท

          = ${item.subtotal} บาท

        </div>
      `).join("")}

      <hr>

      <h3>
        Total: ${order.total} บาท
      </h3>

    </div>
  `
}



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
    const name = input1.value
    const price = Number(input2.value)
    const author = input3.value
    const detail = input4.value
    postBook(name, price, author, detail, image)
      .then((data) => {
        console.log(data)
        return loadBooks()
      })
      .then((data) => {
        showBooks(data)
      })
  })

function addCart(id_product, quantity) {
  console.log("addCart work on >>", cart)
  const exist = cart.find(
    item => item.id_product === id_product
  )
  if (exist) {
    exist.quantity += quantity
  } else {
    cart.push({
      id_product: id_product,
      quantity: quantity
    })
  }

  console.log("Add order in cart >> ", cart)
  showCart()
}


// --------- Create Order -------------

const createOrderBtn =
  document.getElementById("createOrderBtn")

createOrderBtn.addEventListener("click", () => {

  if (cart.length === 0) {
    alert("Cart is empty")
    return
  }

  createOrder({
    id_cust: 3101,
    items: cart
  })
    .then(data => {

      console.log("Create order result >>", data)

      alert(
        `Order created: ${data.id_order}`
      )

      return getOrder(data.id_order)
    })
    .then(order => {

      console.log("Get order result >>", order)

      cart = []
      showCart()

      showOrder(order)

    })
    .catch(error => {

      console.error(error)

      alert("Create order failed")

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
    editBook(id, name, price, author, detail, image)
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