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
  getEmployeeOrders,
  getCustomerOrders,
  getAccount,
  login,
  addWishlist,
  getWishlist,
  deleteWishlist,
  updateAccount,
  register,
  uploadPaymentSlip,
  getEligibleCustomers,
  promoteCustomerToStaff
} from "./api.js"

let cart = []
let books = []
let wishlist = []
let currentUser =
  JSON.parse(sessionStorage.getItem("currentUser")) || null

async function loadUserData() {

  if (!currentUser) {
    return
  }

  // ---------- Account ----------
  if (currentUser.id_acc) {

    try {

      const account =
        await getAccount(currentUser.id_acc)

      console.log("Account >>", account)

      document.getElementById("profile").innerHTML = `
        <div>
          Username: ${account.username}
        </div>

        <div>
          Name: ${account.fname} ${account.lname}
        </div>

        <div>
          Birth Year: ${account.birthyear}
        </div>

        <div>
          Address: ${account.address}
        </div>

        <div>
        Tel: ${account.tel}
    </div>
      `
      const form =
        document.getElementById("editProfileForm")

      form.querySelector('[name="fname"]').value =
        account.fname

      form.querySelector('[name="lname"]').value =
        account.lname

      form.querySelector('[name="birthyear"]').value =
        account.birthyear

      form.querySelector('[name="address"]').value =
        account.address

      form.querySelector('[name="tel"]').value =
        account.tel

      if (account.has_image) {

        document.getElementById("profileImage").src =
          `http://localhost:3000/account/${account.id_acc}/profile-image`
      }

    } catch (error) {

      console.error(error)

    }
  }


  // ---------- Customer ----------
  if (currentUser.id_cust) {

    try {

      const [wishlistData, orderData] =
        await Promise.all([

          getWishlist(currentUser.id_cust),

          getCustomerOrders(
            currentUser.id_cust
          )

        ])

      wishlist = wishlistData

      showWishlist(wishlistData)
      updateWishlistButtons()

      showCustomerOrders(orderData)

    } catch (error) {

      console.error(error)

    }
  }


  // ---------- Employee ----------
  if (currentUser.id_emp) {

    try {

      const [
        unassignedOrders,
        myOrders
      ] = await Promise.all([

        getUnassignedOrders(),

        getEmployeeOrders(
          currentUser.id_emp
        )

      ])

      showEmployeeOrders(
        unassignedOrders
      )

      showMyOrders(
        myOrders
      )

    } catch (error) {

      console.error(error)

    }
  }

  // ---------- Manager ----------
  const managerList = document.getElementById(
    "eligibleCustomerList"
  )

  if (currentUser.role === "manager" && currentUser.id_emp) {
    await loadEligibleCustomers()
  } else if (managerList) {
    managerList.replaceChildren()
  }
}

async function loadEligibleCustomers() {
  const list = document.getElementById(
    "eligibleCustomerList"
  )

  if (!list) return

  try {
    const customers = await getEligibleCustomers(
      currentUser.id_emp
    )

    showEligibleCustomers(customers)

  } catch (error) {
    console.error(error)
    list.textContent = error.message
  }
}

function showEligibleCustomers(customers) {
  const list = document.getElementById(
    "eligibleCustomerList"
  )

  if (!list) return

  list.replaceChildren()

  if (customers.length === 0) {
    list.textContent =
      "No customers available for promotion."
    return
  }

  customers.forEach(customer => {
    const card = document.createElement("div")

    const heading = document.createElement("h3")
    heading.textContent =
      `${customer.fname} ${customer.lname}`

    const info = document.createElement("p")
    info.textContent =
      `Username: ${customer.username} | Customer ID: ${customer.id_cust}`

    const button = document.createElement("button")
    button.textContent = "Promote to STAFF"
    button.dataset.id = customer.id_cust

    button.addEventListener("click", async () => {
      const confirmed = confirm(
        `Promote ${customer.fname} ${customer.lname} to STAFF?`
      )

      if (!confirmed) return

      try {
        const result = await promoteCustomerToStaff(
          currentUser.id_emp,
          customer.id_cust
        )

        alert(result.message)

        // โหลดรายชื่อใหม่หลังแต่งตั้งสำเร็จ
        await loadEligibleCustomers()

      } catch (error) {
        console.error(error)
        alert(error.message)
      }
    })

    card.append(heading, info, button)
    list.append(card)
  })
}

// ++++++++++++++++++++++++++++++++++ GET +++++++++++++++++++++++

function updateWishlistButtons() {
  document
    .querySelectorAll(".wishlistBtn")
    .forEach(button => {
      const id_product = Number(button.dataset.id)

      const liked = wishlist.some(item =>
        Number(item.id) === id_product
      )

      if (liked) {
        button.textContent = "♥"
        button.classList.add("liked")
      } else {
        button.textContent = "♡"
        button.classList.remove("liked")
      }
    })
}

function showWishlist(data) {

  const list =
    document.getElementById("wishlistList")

  list.innerHTML = ""

  data.forEach(item => {

    list.innerHTML += `
            <div>

                <img
                    src="${item.image}"
                    alt="${item.name}"
                    style="width:150px;"
                >

                <h3>
                    ${item.name}
                </h3>

                <div>
                    Price: ${item.price}
                </div>

                <div>
                    Author: ${item.author}
                </div>

                <button
                    class="removeWishlistBtn"
                    data-id="${item.id_wishlist}">
                    Remove
                </button>

            </div>
        `
  })

  document
    .querySelectorAll(".removeWishlistBtn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.id)

        deleteWishlist(id)
          .then(() => {

            return getWishlist(currentUser.id_cust)

          })
          .then(data => {

            wishlist = data

            showWishlist(data)

            updateWishlistButtons()

          })
      })
    })
}

if (currentUser && currentUser.id_cust) {
  getWishlist(currentUser.id_cust)
    .then(data => {

      console.log(
        "My Wishlist >>",
        data
      )

      wishlist = data
      showWishlist(data)
      updateWishlistButtons()

    })
}

function updateBookActionButtons() {
  const isEmployee =
    currentUser?.role === "employee"

  document
    .querySelectorAll(
      '.delBtn[data-role="employee"], .editBtn[data-role="employee"]'
    )
    .forEach(button => {
      button.classList.toggle("hidden", !isEmployee)
    })
}

function showBooks(data) {

  const list = document.getElementById("booklist")

  list.className =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

  list.innerHTML = ""

  data.forEach(book => {

    list.innerHTML += `
      
  <div class="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

    <div class="flex h-64 items-center justify-center overflow-hidden bg-stone-100">
      <img
        src="${book.image}"
        alt="${book.name}"
        class="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
      />
    </div>

    <div class="flex flex-1 flex-col p-5">

      <h3 class="mb-2 text-lg font-semibold text-stone-800">
        ${book.name}
      </h3>

      <p class="mb-1 text-sm text-stone-500">
        ผู้เขียน: ${book.author}
      </p>

      <p class="mb-4 flex-1 text-sm leading-6 text-stone-600">
        ${book.detail}
      </p>

      <p class="mb-4 text-xl font-bold text-amber-900">
        ${Number(book.price).toLocaleString("th-TH")} บาท
      </p>

      <div class="mb-4 flex items-center gap-2">
        <label class="text-sm text-stone-600">จำนวน</label>
        <input
          type="number"
          min="1"
          value="1"
          class="qtyInput w-20 rounded-lg border border-stone-300 px-3 py-2 text-center outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-100"
          data-id="${book.id}"
        />
      </div>

      <div class="mb-3 flex gap-2">
        <button
          class="wishlistBtn flex-1 rounded-lg border border-rose-200 px-3 py-2 text-lg text-rose-600 transition hover:bg-rose-50"
          data-id="${book.id}"
          title="Wishlist"
          aria-label="เพิ่มหนังสือในรายการโปรด"
        >
          ♡
        </button>

        <button
          class="addCartBtn flex-[3] rounded-lg bg-amber-900 px-4 py-2 font-medium text-white transition hover:bg-amber-950"
          data-id="${book.id}"
        >
          เพิ่มลงตะกร้า
        </button>
      </div>

      <div class="flex gap-2 border-t border-stone-100 pt-3">
        <button
          data-id="${book.id}"
          class="delBtn hidden flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          data-role="employee"
        >
          ลบหนังสือ
        </button>

        <button
          data-id="${book.id}"
          data-name="${book.name}"
          data-price="${book.price}"
          class="editBtn hidden flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
          data-role="employee"
        >
          แก้ไข
        </button>
      </div>

    </div>
  </div>
    `
  })

  const wishlistButtons =
    document.querySelectorAll(".wishlistBtn")
  wishlistButtons.forEach(button => {

    button.addEventListener("click", async () => {

      const id_product =
        Number(button.dataset.id)

      const exist =
        wishlist.find(item =>
          Number(item.id) === id_product
        )

      try {

        if (exist) {

          // มีอยู่แล้ว -> ลบออก
          await deleteWishlist(
            exist.id_wishlist
          )

        } else {

          // ยังไม่มี -> เพิ่ม
          await addWishlist(
            currentUser.id_cust,
            id_product
          )

        }

        // โหลด Wishlist ใหม่จาก Database
        wishlist =
          await getWishlist(currentUser.id_cust)

        // เปลี่ยนหัวใจทันที
        updateWishlistButtons()

        // แสดง Wishlist
        showWishlist(wishlist)

      } catch (error) {

        console.error(error)

        alert(error.message)
      }
    })
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
    books = data
    showBooks(data)
    updateWishlistButtons()
    updateBookActionButtons()
  })


function showCart() {
  const cartList = document.getElementById("cartList")

  cartList.innerHTML = ""

  let total = 0

  if (cart.length === 0) {
    cartList.innerHTML = `
      <div class="rounded-2xl border border-stone-200
                  bg-white p-8 text-center">
        <div class="mb-3 text-4xl">🛒</div>
        <h3 class="text-lg font-semibold text-stone-800">
          ตะกร้าของคุณยังว่างอยู่
        </h3>
        <p class="mt-2 text-sm text-stone-500">
          เลือกหนังสือที่สนใจแล้วเพิ่มลงตะกร้าได้เลย
        </p>
      </div>
    `
  }

  cart.forEach(item => {
    const book = books.find(
      book => Number(book.id) === Number(item.id_product)
    )

    if (!book) return

    const price = Number(book.price)
    const subtotal = price * item.quantity

    total += subtotal

    cartList.innerHTML += `
      <div class="mb-4 flex flex-col gap-4 rounded-2xl
                  border border-stone-200 bg-white p-4
                  shadow-sm sm:flex-row sm:items-center">

        <img
          src="${book.image}"
          alt="${book.name}"
          class="h-28 w-24 rounded-lg bg-stone-100
                 object-contain p-2"
        />

        <div class="flex-1">
          <h3 class="text-lg font-semibold text-stone-800">
            ${book.name}
          </h3>

          <p class="mt-1 text-sm text-stone-500">
            ราคาต่อเล่ม:
            ${price.toLocaleString("th-TH")} บาท
          </p>

          <div class="mt-3 flex items-center gap-3">
            <span class="text-sm text-stone-600">
              จำนวน
            </span>

            <button
              class="minusCartBtn rounded-lg border
                     border-stone-300 px-3 py-1
                     hover:bg-stone-100"
              data-id="${item.id_product}">
              −
            </button>

            <span class="min-w-6 text-center font-medium">
              ${item.quantity}
            </span>

            <button
              class="plusCartBtn rounded-lg border
                     border-stone-300 px-3 py-1
                     hover:bg-stone-100"
              data-id="${item.id_product}">
              +
            </button>
          </div>
        </div>

        <div class="sm:text-right">
          <p class="font-bold text-amber-900">
            ${subtotal.toLocaleString("th-TH")} บาท
          </p>

          <button
            class="removeCartBtn mt-3 text-sm
                   text-red-600 hover:text-red-800"
            data-id="${item.id_product}">
            ลบออกจากตะกร้า
          </button>
        </div>
      </div>
    `
  })

  cartList.innerHTML += `
    <div class="rounded-2xl bg-amber-50 p-5
                text-right">
      <p class="text-sm text-stone-600">
        ยอดรวมทั้งหมด
      </p>

      <p class="mt-1 text-2xl font-bold text-amber-900">
        ${total.toLocaleString("th-TH")} บาท
      </p>
    </div>
  `

  // เพิ่มจำนวนสินค้า
  document.querySelectorAll(".plusCartBtn")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id)

        const item = cart.find(
          item => Number(item.id_product) === id
        )

        if (item) {
          item.quantity += 1
        }

        showCart()
      })
    })

  // ลดจำนวนสินค้า
  document.querySelectorAll(".minusCartBtn")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id)

        const item = cart.find(
          item => Number(item.id_product) === id
        )

        if (item) {
          item.quantity -= 1

          if (item.quantity <= 0) {
            cart = cart.filter(
              item => Number(item.id_product) !== id
            )
          }
        }

        showCart()
      })
    })

  // ลบสินค้าออกจากตะกร้า
  document.querySelectorAll(".removeCartBtn")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.id)

        cart = cart.filter(
          item => Number(item.id_product) !== id
        )

        showCart()
      })
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
                ${item.name}
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

      </div>
    `
  })

  document
    .querySelectorAll(".assignOrderBtn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id_order =
          Number(button.dataset.id)

        assignOrder(id_order, currentUser.id_emp)
          .then(data => {

            console.log("Assigned >>", data)

            return Promise.all([
              getUnassignedOrders(),
              getEmployeeOrders(currentUser.id_emp)
            ])

          })
          .then(([unassigned, myOrders]) => {

            showEmployeeOrders(unassigned)
            showMyOrders(myOrders)

          })
      })
    })
}

function showMyOrders(data) {

  const list =
    document.getElementById("myOrderList")

  list.innerHTML = ""

  data.forEach(order => {

    let slipButton = ""

    if (order.has_slip) {
      slipButton = `
        <button
            class="viewSlipBtn"
            data-id="${order.id_order}">
            View Slip
        </button>
    `
    }

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

                ${slipButton}

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
    .querySelectorAll(".viewSlipBtn")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id_order = Number(button.dataset.id)

        window.open(
          `http://localhost:3000/order/${id_order}/slip`,
          "_blank"
        )
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

            return getEmployeeOrders(currentUser.id_emp)
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

function showCustomerOrders(data) {

  const list =
    document.getElementById("customerOrderList")

  list.innerHTML = ""



  data.forEach(order => {

    let cancelButton = ""
    let paymentButton = ""

    if (
      order.status === "Pending" ||
      order.status === "Processing" ||
      order.status === "Paid"
    ) {

      cancelButton = `
        <button
            class="cancelOrderBtn"
            data-id="${order.id_order}">
            Cancel Order
        </button>
    `
    }

    if (
      order.status === "Pending" ||
      order.status === "Processing"
    ) {

      paymentButton = `
        <input
            type="file"
            class="slipInput"
            data-id="${order.id_order}"
            accept="image/*"
        >

        <button
            class="uploadSlipBtn"
            data-id="${order.id_order}">
            Upload Slip
        </button>
    `
    }

    list.innerHTML += `
    <div>

        <h3>
            Order #${order.id_order}
        </h3>

        <div>
            Status: ${order.status}
        </div>

        <div>
            Total: ${order.total} บาท
        </div>

        <button
            class="customerViewOrderBtn"
            data-id="${order.id_order}">
            View Detail
        </button>

        ${paymentButton}

        ${cancelButton}

    </div>
`
  })

  document
    .querySelectorAll(".customerViewOrderBtn")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id_order =
          Number(button.dataset.id)

        getOrder(id_order)
          .then(order => {

            console.log(
              "Customer order detail >>",
              order
            )

            showOrderDetail(order)

          })
          .catch(error => {

            console.error(error)

          })
      })
    })

  document
    .querySelectorAll(".uploadSlipBtn")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id_order =
            Number(button.dataset.id)

          const input =
            document.querySelector(
              `.slipInput[data-id="${id_order}"]`
            )

          const file =
            input.files[0]

          if (!file) {
            alert(
              "Please select payment slip"
            )
            return
          }

          try {

            const data =
              await uploadPaymentSlip(
                id_order,
                file
              )

            console.log(
              "Upload slip >>",
              data
            )

            alert(
              "Payment slip uploaded"
            )

            const orders =
              await getCustomerOrders(
                currentUser.id_cust
              )

            showCustomerOrders(
              orders
            )

          } catch (error) {

            console.error(error)

            alert(error.message)
          }
        }
      )
    })

  document
    .querySelectorAll(".cancelOrderBtn")
    .forEach(button => {

      button.addEventListener("click", async () => {

        const id_order =
          Number(button.dataset.id)

        const confirmCancel =
          confirm(
            `Cancel Order #${id_order}?`
          )

        if (!confirmCancel) {
          return
        }

        try {

          await updateOrderStatus(
            id_order,
            "CANCELLED"
          )

          const data =
            await getCustomerOrders(
              currentUser.id_cust
            )

          showCustomerOrders(data)

          alert("Order cancelled")

        } catch (error) {

          console.error(error)

          alert(error.message)

        }
      })
    })
}

function updateRoleBasedUI() {

  const isCustomer =
    !!currentUser?.id_cust

  const isEmployee =
    !!currentUser?.id_emp

  document
    .querySelectorAll('[data-role="customer"]')
    .forEach(element => {

      element.hidden = !isCustomer
    })

  document
    .querySelectorAll('[data-role="employee"]')
    .forEach(element => {

      element.hidden = !isEmployee
    })

  const isManager = currentUser?.role === "manager"

  document
    .querySelectorAll('[data-role="manager"]')
    .forEach(element => {
      element.hidden = !isManager
    })

  updateBookActionButtons()
}

loadUserData()
  .then(() => {

    updateRoleBasedUI()

  })

document.getElementById(
  "paymentArea"
).innerHTML = `
    <h3>
        Scan QR to Pay
    </h3>

    <img
        src="./images/qr.png"
        alt="Payment QR"
        style="width:200px;"
    >

    <p>
        Amount: 1,190 บาท
    </p>
`

// +++++++++++++++++++++++++++++ POST +++++++++++++++++++++++++++++

document
  .getElementById("registerForm")
  .addEventListener("submit", async event => {

    event.preventDefault()

    const form =
      event.currentTarget

    const fname =
      form.querySelector(
        '[name="fname"]'
      ).value

    const lname =
      form.querySelector(
        '[name="lname"]'
      ).value

    const birthyear =
      Number(
        form.querySelector(
          '[name="birthyear"]'
        ).value
      )

    const address =
      form.querySelector(
        '[name="address"]'
      ).value

    const tel =
      form.querySelector(
        '[name="tel"]'
      ).value

    const username =
      form.querySelector(
        '[name="username"]'
      ).value

    const password =
      form.querySelector(
        '[name="password"]'
      ).value

    try {

      const data =
        await register(
          fname,
          lname,
          birthyear,
          address,
          tel,
          username,
          password
        )

      console.log(
        "Register success >>",
        data
      )

      document.getElementById(
        "registerResult"
      ).innerHTML = `
        <div>
          Register successful
        </div>

        <div>
          Customer ID: ${data.id_cust}
        </div>

        <div>
          Username: ${data.account.username}
        </div>
      `

      form.reset()

    } catch (error) {

      console.error(error)

      document.getElementById(
        "registerResult"
      ).innerHTML = `
        <div>
          ${error.message}
        </div>
      `
    }
  })

document.getElementById("loginForm")
  .addEventListener("submit", event => {

    event.preventDefault()

    const form = event.currentTarget

    const username =
      form.querySelector('[name="username"]').value

    const password =
      form.querySelector('[name="password"]').value

    login(username, password)
      .then(async data => {

        console.log("Login success >>", data)

        currentUser = data

        sessionStorage.setItem(
          "currentUser",
          JSON.stringify(currentUser)
        )

        await loadUserData()

        const booksData = await loadBooks()

        showBooks(booksData)

        updateRoleBasedUI()

        document.getElementById("loginResult")
          .innerHTML = `
        <div>
          Login success
        </div>

        <div>
          User: ${data.username}
        </div>

        <div>
          Customer ID: ${data.id_cust ?? "-"}
        </div>

        <div>
          Employee ID: ${data.id_emp ?? "-"}
        </div>

        <div>
          Role: ${data.role ?? "-"}
        </div>
      `
      })
      .catch(error => {

        console.error(error)

        document.getElementById("loginResult")
          .innerHTML = `
                        <div>
                            ${error.message}
                        </div>
                    `
      })
  })

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
    id_cust: currentUser.id_cust,
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

document
  .getElementById("editProfileForm")
  .addEventListener("submit", async event => {

    event.preventDefault()

    if (!currentUser) {

      alert("Please login first")
      return
    }

    const form =
      event.currentTarget

    const fname =
      form.querySelector(
        '[name="fname"]'
      ).value

    const lname =
      form.querySelector(
        '[name="lname"]'
      ).value

    const birthyear =
      Number(
        form.querySelector(
          '[name="birthyear"]'
        ).value
      )

    const address =
      form.querySelector(
        '[name="address"]'
      ).value

    const tel =
      form.querySelector(
        '[name="tel"]'
      ).value

    try {

      const data =
        await updateAccount(
          currentUser.id_acc,
          fname,
          lname,
          birthyear,
          address,
          tel
        )

      console.log(
        "Update profile >>",
        data
      )

      alert("Profile updated")

      await loadUserData()

      document.getElementById(
        "editProfileFormContainer"
      ).hidden = true

    } catch (error) {

      console.error(error)

      alert(error.message)
    }
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

document.getElementById(
  "editProfileBtn"
).addEventListener("click", () => {

  document.getElementById(
    "editProfileFormContainer"
  ).hidden = false
})

document
  .getElementById("logoutBtn")
  .addEventListener("click", () => {

    sessionStorage.removeItem("currentUser")

    currentUser = null

    cart = []
    wishlist = []

    updateRoleBasedUI()

    document.getElementById("profile").innerHTML = ""

    document.getElementById("wishlistList").innerHTML = ""

    document.getElementById("customerOrderList").innerHTML = ""

    document.getElementById("employeeOrderList").innerHTML = ""

    document.getElementById("myOrderList").innerHTML = ""

    document.getElementById("employeeOrderDetail").innerHTML = ""

    document.getElementById("loginResult").innerHTML = ""

    alert("Logout successful")
  })