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

updateLoginUI()

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
  <div class="rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] p-6 shadow-sm">

    <div class="mb-6 border-b border-[#E8D9C8] pb-4">
      <p class="text-sm tracking-widest text-[#9A806C]">
        MY ACCOUNT
      </p>

      <h2 class="mt-2 text-2xl font-bold text-[#80513D]">
        ข้อมูลส่วนตัว
      </h2>

      <div class="mt-3 inline-block rounded-full bg-[#F3E7D8] px-4 py-1.5 text-sm font-medium text-[#80513D]">
        ตำแหน่ง: ${
          currentUser.role === "customer" ? "ลูกค้า" :
          currentUser.role === "employee" ? "พนักงาน" :
          currentUser.role === "manager" ? "ผู้จัดการ" :
          currentUser.role ?? "ไม่ระบุ"
        }
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

      <div class="rounded-xl bg-[#F8F1E8] p-4">
        <p class="text-sm text-[#9A806C]">ชื่อผู้ใช้</p>
        <p class="mt-1 break-words font-semibold text-[#543827]">
          ${account.username ?? "-"}
        </p>
      </div>

      <div class="rounded-xl bg-[#F8F1E8] p-4">
        <p class="text-sm text-[#9A806C]">ชื่อ-นามสกุล</p>
        <p class="mt-1 break-words font-semibold text-[#543827]">
          ${account.fname ?? "-"} ${account.lname ?? ""}
        </p>
      </div>

      <div class="rounded-xl bg-[#F8F1E8] p-4">
        <p class="text-sm text-[#9A806C]">ปีเกิด</p>
        <p class="mt-1 font-semibold text-[#543827]">
          ${account.birthyear ?? "-"}
        </p>
      </div>

      <div class="rounded-xl bg-[#F8F1E8] p-4">
        <p class="text-sm text-[#9A806C]">เบอร์โทรศัพท์</p>
        <p class="mt-1 break-words font-semibold text-[#543827]">
          ${account.tel ?? "-"}
        </p>
      </div>

      <div class="rounded-xl bg-[#F8F1E8] p-4 sm:col-span-2">
        <p class="text-sm text-[#9A806C]">ที่อยู่</p>
        <p class="mt-1 break-words font-semibold text-[#543827]">
          ${account.address ?? "-"}
        </p>
      </div>

    </div>
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
            
<div class="flex flex-col gap-4 rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] p-4 shadow-sm transition hover:shadow-md sm:flex-row">

  <img
    src="${item.image}"
    alt="${item.name}"
    class="h-40 w-28 rounded-lg object-cover"
  >

  <div class="flex flex-1 flex-col">

    <h3 class="text-lg font-bold text-[#80513D]">
      ${item.name}
    </h3>

    <p class="mt-1 text-sm text-[#806D5D]">
      ผู้เขียน: ${item.author || "ไม่ระบุ"}
    </p>

    <p class="mt-2 font-semibold text-[#72765A]">
      ${Number(item.price).toLocaleString("th-TH")} บาท
    </p>

    <div class="mt-auto pt-4">
      <button
        class="removeWishlistBtn rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
        data-id="${item.id_wishlist}">
        remove
      </button>
    </div>

  </div>
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
  const isEmployee = Boolean(currentUser?.id_emp)

  document
    .querySelectorAll("#booklist .editBtn, #booklist .delBtn")
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
      
  <div class="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
  <div class="relative flex h-64 items-center justify-center overflow-hidden bg-[#F7F1E5] p-4">
    <img
      src="${book.image}"
      alt="${book.name}"
      class="h-full w-auto max-w-full object-contain transition duration-300 group-hover:scale-105"
    >
    <button
      class="wishlistBtn absolute right-3 top-3 rounded-full bg-white/90 px-3 py-2 text-xl text-rose-600 shadow-sm transition hover:bg-rose-50"
      data-id="${book.id}"
      title="เพิ่มในรายการโปรด"
    >♡</button>
  </div>

  <div class="flex flex-1 flex-col p-4">
    <h3 class="line-clamp-2 text-lg font-bold leading-snug text-[#80513D]">
      ${book.name}
    </h3>
    <p class="mt-2 text-sm text-[#806D5D]">ผู้เขียน: ${book.author || "ไม่ระบุ"}</p>
    <p class="mt-3 text-xl font-bold text-[#72765A]">
      ${Number(book.price).toLocaleString("th-TH")} บาท
    </p>
    <p class="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">
      ${book.detail || "ไม่มีรายละเอียดหนังสือ"}
    </p>

    <div class="mt-auto pt-4">
      <label class="mb-1 block text-sm text-[#806D5D]">จำนวน</label>
      <input
        type="number"
        min="1"
        value="1"
        class="qtyInput w-20 rounded-lg border border-[#DCCAB6] bg-white px-3 py-2 text-center outline-none focus:border-[#80513D] focus:ring-2 focus:ring-[#80513D]/20"
        data-id="${book.id}"
      >

      <button
        class="addCartBtn mt-3 w-full rounded-xl bg-[#80513D] px-4 py-3 font-semibold text-white transition hover:bg-[#633A29]"
        data-id="${book.id}"
      >เพิ่มลงตะกร้า</button>

      <div class="mt-2 flex gap-2">
        <button
          class="editBtn hidden flex-1 rounded-lg border border-[#DCCAB6] px-3 py-2 text-sm font-medium text-[#80513D] transition hover:bg-[#F7F1E5]"
          data-id="${book.id}"
          data-name="${book.name}"
          data-price="${book.price}"
          data-role="employee"
        >แก้ไข</button>

        <button
          class="delBtn hidden flex-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          data-id="${book.id}"
          data-role="employee"
        >ลบ</button>
      </div>
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
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id)

      const confirmed = confirm(
        "ยืนยันที่จะลบหนังสือเล่มนี้หรือไม่?"
      )

      if (!confirmed) {
        return
      }

      try {
        await delBook(id)

        const data = await loadBooks()
        books = data
        showBooks(data)
        updateWishlistButtons()
        updateBookActionButtons()

        alert("ลบหนังสือเรียบร้อยแล้ว")
      } catch (error) {
        console.error(error)
        alert("ลบหนังสือไม่สำเร็จ")
      }
    })
  })



  buttonEdit.forEach(button => {
  button.addEventListener("click", () => {

    const id = Number(button.dataset.id)

    const book = books.find(
      book => Number(book.id) === id
    )

    if (!book) {
      alert("ไม่พบข้อมูลหนังสือ")
      return
    }

    const form = document.getElementById("EditForm")

    form.querySelector('[name="id"]').value = book.id
    form.querySelector('[name="name"]').value = book.name
    form.querySelector('[name="price"]').value = book.price
    form.querySelector('[name="author"]').value = book.author
    form.querySelector('[name="detail"]').value = book.detail

    console.log("Book to edit >>", book)

  })
})
} loadBooks()
  .then((data) => {
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
            class="cancelOrderBtn rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
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
            class="uploadSlipBtn rounded-lg bg-[#72765A] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C6047]"
            data-id="${order.id_order}">
            Upload Slip
        </button>
    `
    }


    const statusStyle = {
      Pending: "bg-amber-100 text-amber-800",
      Processing: "bg-blue-100 text-blue-800",
      Paid: "bg-emerald-100 text-emerald-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      Shipped: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      Delivered: "bg-green-100 text-green-800",
      CANCELLED: "bg-rose-100 text-rose-800",
      Cancelled: "bg-rose-100 text-rose-800"
    };

    list.innerHTML += `
      <article class="rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

        <div class="flex flex-wrap items-start justify-between gap-3">

          <div>
            <p class="text-xs font-medium uppercase tracking-widest text-[#9A806C]">
              Order Number
            </p>

            <h3 class="mt-1 text-xl font-bold text-[#80513D]">
              #${order.id_order}
            </h3>
          </div>

          <span class="rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[order.status] || "bg-gray-100 text-gray-700"
      }">
            ${order.status}
          </span>

        </div>

        <div class="my-4 border-t border-dashed border-[#E8D9C8]"></div>

        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-[#806D5D]">
            ยอดรวม
          </span>

          <span class="text-lg font-bold text-[#80513D]">
            ${Number(order.total).toLocaleString("th-TH")} บาท
          </span>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">

          <button
            class="customerViewOrderBtn rounded-lg bg-[#80513D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#633A29]"
            data-id="${order.id_order}">
            ดูรายละเอียด
          </button>

          ${paymentButton ? `
            <div class="w-full space-y-2 rounded-xl bg-[#F7F1E5] p-3">
              <label class="block text-sm font-medium text-[#80513D]">
                แนบหลักฐานการชำระเงิน
              </label>
              ${paymentButton}
            </div>
          ` : ""}

          ${cancelButton ? `
            <div class="ml-auto">
              ${cancelButton}
            </div>
          ` : ""}

        </div>

      </article>
    `;

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
    .querySelectorAll("#booklist .editBtn, #booklist .delBtn")
    .forEach(element => {
      element.classList.toggle("hidden", !isEmployee)
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


document.getElementById("EditForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault()

    const form = event.currentTarget

    const id = Number(form.querySelector('[name="id"]').value)
    const name = form.querySelector('[name="name"]').value
    const price = Number(form.querySelector('[name="price"]').value)
    const author = form.querySelector('[name="author"]').value
    const detail = form.querySelector('[name="detail"]').value
    const image = form.querySelector('[name="image"]').value

    try {
      await editBook(id, name, price, author, detail, image)

      const data = await loadBooks()

      books = data
      showBooks(data)
      updateBookActionButtons()

      alert("แก้ไขหนังสือสำเร็จแล้ว")

    } catch (error) {
      console.error("Edit book error:", error)
      alert("แก้ไขหนังสือไม่สำเร็จ: " + error.message)
    }
  })



document.getElementById("bookForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const input1 = document.querySelector('[name="name"]')
    const input2 = document.querySelector('[name="price"]')
    const input3 = document.querySelector('[name="author"]')
    const input4 = document.querySelector('[name="detail"]')

    const image = "/images/newbook.png"
    const name = input1.value
    const price = Number(input2.value)
    const author = input3.value
    const detail = input4.value

    try {
      await postBook(name, price, author, detail, image)

      const data = await loadBooks()

      books = data
      showBooks(data)
      updateBookActionButtons()

      alert("เพิ่มหนังสือสำเร็จแล้ว")

      form.reset()

    } catch (error) {
      console.error("Add book error:", error)
      alert("เพิ่มหนังสือไม่สำเร็จ: " + error.message)
    }
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
    const image = input6.value
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

const delForm = document.getElementById("delForm")

if (delForm) {
  delForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    const num1 = form.querySelector('[name="id"]')
    const id = Number(num1.value)

    try {
      await delBook(id)

      const data = await loadBooks()
      books = data
      showBooks(data)
      updateBookActionButtons()

      alert("ลบหนังสือสำเร็จแล้ว")
    } catch (error) {
      console.error("Delete book error:", error)
      alert("ลบหนังสือไม่สำเร็จ: " + error.message)
    }
  })
}

const editProfileBtn = document.getElementById("editProfileBtn")

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    document.getElementById("editProfileFormContainer").hidden = false
  })
}

document
  .getElementById("logoutBtn")
  .addEventListener("click", () => {

    sessionStorage.removeItem("currentUser")

    currentUser = null

    updateLoginUI()

    document.getElementById("LoginContainer").hidden = true

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


const LoginBtn = document.getElementById("LoginBtn")

if (LoginBtn) {
  LoginBtn.addEventListener("click", () => {
    document.getElementById("LoginContainer").hidden = false
  })
}

const ProfileBtn = document.getElementById("ProfileBtn")

if (ProfileBtn) {
  ProfileBtn.addEventListener("click", () => {
    document.getElementById("ProfileCon").hidden = false
  })
}


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
        alert("เข้าสู่ระบบสำเร็จ")

        currentUser = data

        sessionStorage.setItem(
          "currentUser",
          JSON.stringify(currentUser)
        )

        updateLoginUI()

        document.getElementById("LoginContainer").hidden = true

        await loadUserData()

        const booksData = await loadBooks()

        showBooks(booksData)

        updateRoleBasedUI()

        document.getElementById("loginResult")
          .innerHTML = `
            <div>Login success</div>
            <div>User: ${data.username}</div>
            <div>Customer ID: ${data.id_cust ?? "-"}</div>
            <div>Employee ID: ${data.id_emp ?? "-"}</div>
            <div>Role: ${data.role ?? "-"}</div>
          `
      })
      .catch(error => {

        console.error(error)

        document.getElementById("loginResult")
          .innerHTML = `
            <div>${error.message}</div>
          `
      })
  })

  function updateLoginUI() {
    const isLoggedIn = currentUser !== null

    document.getElementById("LoginBtn").hidden = isLoggedIn
    document.getElementById("ProfileBtn").hidden = !isLoggedIn
    document.getElementById("logoutBtn").hidden = !isLoggedIn
}
