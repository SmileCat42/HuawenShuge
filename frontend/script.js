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
  promoteCustomerToStaff,
  getAllAccounts,
  changeAccountRole
} from "./api.js"

let cart = []
let books = []
let wishlist = []
let currentUser =
  JSON.parse(sessionStorage.getItem("currentUser")) || null

updateLoginUI();
updateEmployeeButtons();


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
  Status : ${({
          2001: "Customer",
          2002: "Staff",
          2003: "Rider",
          2004: "Manager",
          2005: "Admin"
        })[Number(currentUser?.id_role)] ?? "Customer"}
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


async function loadAllAccounts() {
  const list = document.getElementById("accountList")

  if (![2004, 2005].includes(Number(currentUser?.id_role))) return

  if (!list) return

  list.textContent = "กำลังโหลดบัญชี..."

  try {
    const accounts = await getAllAccounts(currentUser.id_emp)
    showAllAccounts(accounts)
  } catch (error) {
    console.error(error)
    list.textContent = error.message
  }
}



function showAllAccounts(accounts) {
  const list = document.getElementById("accountList")

  if (!list) return

  list.replaceChildren()

  if (accounts.length === 0) {
    list.textContent = "ไม่พบบัญชี"
    return
  }

  accounts.forEach(account => {
    const card = document.createElement("div")
    card.className =
      "rounded-xl border border-[#E8D9C8] bg-white p-4"

    const heading = document.createElement("h3")
    heading.className = "font-bold text-[#80513D]"
    heading.textContent =
      `${account.fname} ${account.lname}`

    const info = document.createElement("div")
    info.className =
      "mt-3 grid grid-cols-1 gap-3 text-sm text-[#806D5D] sm:grid-cols-2"

    const details = [
      ["Username", account.username],
      ["Account ID", account.id_acc],
      ["ปีเกิด", account.birthyear],
      ["เบอร์โทรศัพท์", account.tel],
      ["ที่อยู่", account.address]
    ]

    details.forEach(([label, value]) => {
      const item = document.createElement("div")
      item.className = "rounded-lg bg-[#F8F1E8] p-3"

      const title = document.createElement("p")
      title.className = "text-xs text-[#9A806C]"
      title.textContent = label

      const text = document.createElement("p")
      text.className = "mt-1 break-words font-medium text-[#543827]"
      text.textContent = value ?? "-"

      item.append(title, text)

      if (label === "ที่อยู่") {
        item.classList.add("sm:col-span-2")
      }

      info.append(item)
    })

    const roleRow = document.createElement("div")
    roleRow.className =
      "mt-3 flex flex-wrap items-center gap-3"

    const roleLabel = document.createElement("label")
    roleLabel.className = "text-sm text-[#806D5D]"
    roleLabel.textContent = "Role:"

    const roleSelect = document.createElement("select")
    roleSelect.className =
      "rounded-lg border border-[#E8D9C8] bg-white px-3 py-2 text-sm text-[#80513D]"

    const roles = [
      { value: "customer", label: "Customer" },
      { value: "staff", label: "Staff" },
      { value: "manager", label: "Manager" }
    ]

    roles.forEach(role => {
      const option = document.createElement("option")
      option.value = role.value
      option.textContent = role.label
      roleSelect.append(option)
    })

    // ตั้งค่า Dropdown เป็น Role ปัจจุบัน
    roleSelect.value = account.role

    const saveButton = document.createElement("button")
    saveButton.type = "button"
    saveButton.className =
      "rounded-lg bg-[#72765A] px-4 py-2 text-sm text-white hover:bg-[#5E6249]"
    saveButton.textContent = "Save"

    const isAdmin = Number(currentUser?.id_role) === 2005

    if (!isAdmin || account.role === "admin") {
      roleSelect.disabled = true
      saveButton.disabled = true
      roleSelect.classList.add("opacity-50", "cursor-not-allowed")
      saveButton.classList.add("opacity-50", "cursor-not-allowed")
    }

    saveButton.addEventListener("click", async () => {
      if (Number(currentUser?.id_role) !== 2005) return

      const newRole = roleSelect.value

      if (newRole === account.role) {
        alert("Role ยังไม่มีการเปลี่ยนแปลง")
        return
      }

      if (!confirm(
        `เปลี่ยน ${account.username} จาก ${account.role} เป็น ${newRole}?`
      )) {
        roleSelect.value = account.role
        return
      }

      saveButton.disabled = true
      saveButton.textContent = "Saving..."

      try {
        const result = await changeAccountRole(
          currentUser.id_emp,
          account.id_person,
          newRole
        )

        alert(result.message)
        await loadAllAccounts()
      } catch (error) {
        console.error(error)
        alert(error.message)
        roleSelect.value = account.role
      } finally {
        saveButton.disabled = false
        saveButton.textContent = "Save"
      }
    })

    roleLabel.append(roleSelect)
    roleRow.append(roleLabel, saveButton)
    card.append(heading, info, roleRow)
    list.append(card)
  })
}

document.getElementById("accountBtn")
  ?.addEventListener("click", async () => {

    if (![2004, 2005].includes(Number(currentUser?.id_role))) {
      return
    }

    const section = document.getElementById("accountManagement")

    if (!section) return

    section.hidden = false

    await loadAllAccounts()

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
  })

document.getElementById("productBtn")?.addEventListener("click", () => {
  document.getElementById("productMng")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

function updateEmployeeButtons() {
  const accountBtn = document.getElementById("accountBtn");
  const productBtn = document.getElementById("productBtn");

  const isEmployee = [2002, 2004, 2005].includes(
    Number(currentUser?.id_role)
  );

  if (accountBtn) {
    accountBtn.hidden = !isEmployee;
  }

  if (productBtn) {
    productBtn.hidden = !isEmployee;
  }
}

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
  const list = document.getElementById("wishlistItems")

  if (!list) return

  list.innerHTML = ""

  // กรณีไม่มีหนังสือใน Wishlist
  if (!data || data.length === 0) {
    list.innerHTML = `
            <div class="py-10 text-center">
                <div class="mb-3 text-5xl text-[#DCCAB6]">♡</div>

                <h3 class="text-lg font-semibold text-[#80513D]">
                    ยังไม่มีหนังสือในรายการโปรด
                </h3>

                <p class="mt-2 text-sm text-[#9A806C]">
                    เลือกหนังสือที่คุณชอบ แล้วกดหัวใจเพื่อบันทึกไว้ได้เลย
                </p>
            </div>
        `
    return
  }

  data.forEach(item => {
    list.innerHTML += `
            <div class="flex flex-col gap-4 rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] p-4 shadow-sm transition hover:shadow-md sm:flex-row">

                <img
                    src="${item.image || "/images/newbook.png"}"
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
                        ฿${Number(item.price).toLocaleString("th-TH")}
                    </p>

                    <div class="mt-4">
                        <button
                            type="button"
                            class="removeWishlistBtn rounded-lg border border-[#DCCAB6] px-4 py-2 text-sm font-medium text-[#CC3333] transition hover:bg-[#CC6666] hover:text-white"
                            data-id="${item.id_wishlist}">
                            remove
                        </button>
                    </div>
                </div>
            </div>
        `
  })

  list.querySelectorAll(".removeWishlistBtn").forEach(button => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id)

      try {
        await deleteWishlist(id)

        wishlist = await getWishlist(currentUser.id_cust)

        showWishlist(wishlist)
        updateWishlistButtons()
      } catch (error) {
        console.error(error)
        alert(error.message)
      }
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


  document
    .querySelectorAll('section[data-role="employee"]')
    .forEach(element => {
      element.hidden = !isEmployee
    })

}

function showBooks(data) {

  const list = document.getElementById("booklist")

  list.className =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

  list.innerHTML = ""

  data.forEach(book => {

    list.innerHTML += `
      
  <div class="group flex h-full mt-10 flex-col overflow-hidden rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
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
        <a href="#EditForm"
   class="editBtn hidden inline-flex flex-1 items-center justify-center rounded-lg border border-[#DCCAB6] px-3 py-2 text-center text-sm font-medium text-[#80513D] transition hover:bg-[#F7F1E5]"
   data-id="${book.id}"
   data-name="${book.name}"
   data-price="${book.price}"
   data-role="employee"
>แก้ไข</a>

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

      if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบ")
        return
      }

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

      if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบ")
        return
      }

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
  <div class="mb-4 rounded-xl border border-[#E8D9C8] bg-white p-5 shadow-sm transition hover:shadow-md">

    <div class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8D9C8] pb-3">
      <h3 class="text-lg font-bold text-[#80513D]">
        Order #${order.id_order}
      </h3>

      <span class="rounded-full bg-[#F7F1E5] px-3 py-1 text-sm font-medium text-[#80513D]">
        ${order.status}
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <span class="text-sm text-[#806D5D]">Customer</span>
        <span class="text-right font-medium text-[#80513D]">
          ${order.id_cust}
        </span>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-[#806D5D]">Total</span>
        <span class="text-lg font-bold text-[#80513D]">
          ${order.total} บาท
        </span>
      </div>
    </div>

    <div class="mt-5 flex justify-end border-t border-[#E8D9C8] pt-4">
      <button
        class="assignOrderBtn rounded-lg bg-[#80513D] px-5 py-2.5 font-medium text-white transition hover:bg-[#65402F] focus:outline-none focus:ring-2 focus:ring-[#B99478] focus:ring-offset-2"
        data-id="${order.id_order}">
        รับ Order
      </button>
    </div>

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
            class="viewSlipBtn rounded-lg bg-[#D9A380] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C6047]"
            data-id="${order.id_order}">
            View Slip
        </button>
    `
    }

    let button = ""

    if (order.status === "PROCESSING") {

      button = `
                <button
                    class="statusBtn rounded-lg bg-[#72765A] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C6047]"
                    data-id="${order.id_order}"
                    data-status="PAID">
                    Mark as PAID
                </button>
            `

    } else if (order.status === "PAID") {

      button = `
                <button
                    class="statusBtn rounded-lg bg-[#72765A] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C6047]"
                    data-id="${order.id_order}"
                    data-status="SHIPPED">
                    Mark as SHIPPED
                </button>
            `

    } else if (order.status === "SHIPPED") {

      button = `
                <button
                    class="statusBtn rounded-lg bg-[#72765A] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C6047]"
                    data-id="${order.id_order}"
                    data-status="DELIVERED">
                    Mark as DELIVERED
                </button>
            `
    }


    list.innerHTML += `
    <div class="rounded-2xl border border-[#E8D9C8] bg-[#FFFDF8] p-5 shadow-sm transition hover:shadow-md sm:p-6">

        <div class="mb-4 flex flex-col gap-3 border-b border-[#E8D9C8] pb-4 sm:flex-row sm:items-center sm:justify-between">

            <h3 class="text-lg font-bold text-[#80513D] sm:text-xl">
                Order #${order.id_order}
            </h3>

            <span class="w-fit rounded-full bg-[#F1E9DC] px-3 py-1 text-sm font-semibold text-[#80513D]">
                ${order.status}
            </span>

        </div>

        <div class="space-y-3 text-sm text-[#806D5D]">

            <div class="flex flex-wrap justify-between gap-2">
                <span class="font-medium text-[#80513D]">
                    Customer
                </span>
                <span>${order.id_cust}</span>
            </div>

            <div class="flex flex-wrap justify-between gap-2">
                <span class="font-medium text-[#80513D]">
                    Total
                </span>
                <span class="font-semibold text-[#80513D]">
                    ${order.total} บาท
                </span>
            </div>

        </div>

        <div class="mt-5 flex flex-wrap gap-2 border-t border-[#E8D9C8] pt-4">

            <button
                class="viewOrderBtn rounded-xl bg-[#80513D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#633A29]"
                data-id="${order.id_order}">
                View Detail
            </button>

            ${slipButton}

            ${button}

        </div>

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

    let qrButton = ""


    if (order.status === "Pending") {
      qrButton = `
    <button
      type="button"
      class="payNowBtn rounded-lg bg-[#E6C29C] px-4 py-2 text-sm font-medium text-walnut hover:bg-[#E3CDA6] hover:text-walnut"
      data-id="${order.id_order}"
      data-amount="${Number(order.total)}">
      ชำระเงิน
    </button>
  `
    }

    let paymentQR = "";

    if (order.status === "Pending") {
      paymentQR = `
    <div class="paymentQR hidden mt-4 rounded-xl border border-[#D8D3C5] bg-white p-4 text-center"
         data-id="${order.id_order}">
      <h3 class="mb-3 font-bold text-[#80513D]">Scan QR to Pay</h3>

      <img
        src="./images/qr2.png"
        alt="Payment QR"
        class="mx-auto mb-3 w-[200px]"
      >

      <p class="text-[#80513D]">
        Amount:
        <span class="font-bold">
          ${Number(order.total).toLocaleString("th-TH")}
        </span>
        บาท
      </p>
    </div>
  `;
    }

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

        <div class="mt-5">

  <!-- แถวปุ่ม -->
  <div class="flex flex-wrap gap-2">

    <button
      class="customerViewOrderBtn rounded-lg bg-[#80513D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#633A29]"
      data-id="${order.id_order}">
      ดูรายละเอียด
    </button>
    
    <div
  id="customerOrderDetail-${order.id_order}"
  class="customerOrderDetail mt-4 hidden w-full basis-full">
</div>

    ${qrButton ? `${qrButton}` : ""}

    ${cancelButton ? `
      <div class="ml-auto">
        ${cancelButton}
      </div>
    ` : ""}

  </div>

  <!-- QR อยู่ใต้ปุ่ม แต่เหนือแนบสลิป -->
  ${paymentQR}

  <!-- ส่วนแนบสลิป -->
  ${paymentButton ? `
    <div class="mt-3 w-full space-y-2 rounded-xl bg-[#F7F1E5] p-3">
      <label class="block text-sm font-medium text-[#80513D]">
        แนบหลักฐานการชำระเงิน
      </label>
      ${paymentButton}
    </div>
  ` : ""}

</div>
      
      </article>
    `;

  })

  document
    .querySelectorAll(".customerViewOrderBtn")
    .forEach(button => {

      button.addEventListener("click", async () => {

        const id_order = Number(button.dataset.id);

        const detail = document.getElementById(
          `customerOrderDetail-${id_order}`
        );

        if (!detail) {
          console.error(
            "ไม่พบพื้นที่แสดงรายละเอียด Order #",
            id_order
          );
          return;
        }

        // ถ้าเปิดอยู่แล้ว ให้ซ่อน
        if (!detail.classList.contains("hidden")) {
          detail.classList.add("hidden");
          return;
        }

        try {
          const order = await getOrder(id_order);

          console.log(
            "Customer order detail >>",
            order
          );

          // แสดงรายละเอียดในพื้นที่ของออเดอร์ที่กดเท่านั้น
          detail.innerHTML = `
          <div class="rounded-xl border border-[#E8D9C8] bg-white p-4">
            <h3 class="mb-4 border-b border-[#E8D9C8] pb-3 text-lg font-bold text-[#80513D]">
              Order #${order.id_order} Details
            </h3>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-3">
                <span class="text-[#806D5D]">Customer</span>
                <span class="font-medium text-[#80513D]">
                  ${order.id_cust}
                </span>
              </div>

              <div class="flex justify-between gap-3">
                <span class="text-[#806D5D]">Employee</span>
                <span class="font-medium text-[#80513D]">
                  ${order.id_emp ?? "Not assigned"}
                </span>
              </div>

              <div class="flex justify-between gap-3">
                <span class="text-[#806D5D]">Status</span>
                <span class="font-medium text-[#80513D]">
                  ${order.status}
                </span>
              </div>

              <div class="flex justify-between gap-3">
                <span class="text-[#806D5D]">Order Date</span>
                <span class="font-medium text-[#80513D]">
                  ${order.order_date}
                </span>
              </div>
            </div>

            <h4 class="mb-3 mt-5 border-b border-[#E8D9C8] pb-2 font-bold text-[#80513D]">
              Items
            </h4>

            <div class="space-y-3">
              ${order.items.map(item => `
                <div class="rounded-lg bg-[#F7F1E5] p-3">
                  <p class="font-medium text-[#80513D]">
                    ${item.name}
                  </p>

                  <div class="mt-2 flex flex-wrap justify-between gap-2 text-sm text-[#806D5D]">
                    <span>
                      ${item.quantity} × ${item.price} บาท
                    </span>

                    <span class="font-semibold text-[#80513D]">
                      ${item.subtotal} บาท
                    </span>
                  </div>
                </div>
              `).join("")}
            </div>

            <div class="mt-4 rounded-lg bg-[#80513D] p-4 text-right text-white">
              <span class="text-sm">Total</span>
              <p class="text-xl font-bold">
                ${order.total} บาท
              </p>
            </div>
          </div>
        `;

          detail.classList.remove("hidden");

        } catch (error) {
          console.error(error);
        }
      });
    });

  document.querySelectorAll(".payNowBtn").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      const qr = document.querySelector(
        `.paymentQR[data-id="${id}"]`
      );

      if (!qr) {
        console.error("ไม่พบ QR ของออเดอร์", id);
        return;
      }

      qr.classList.toggle("hidden");
    });
  });

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

  const accountBtn = document.getElementById("accountBtn")

  if (accountBtn) {
    const roleId = Number(currentUser?.id_role)
    accountBtn.hidden = !currentUser || ![2004, 2005].includes(roleId)
  }

  updateBookActionButtons()
}

loadUserData()
  .then(() => {

    updateRoleBasedUI()

  })

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

      alert("สมัครสมาชิกสำเร็จ")

      document.getElementById(
        "registerResult"
      ).innerHTML = `
        <div class="text-green">
          Register successful
        </div>

        <div>
        Welcome... ${data.fname}
        </div>
      `

      form.reset()

    } catch (error) {

      console.error(error)

      document.getElementById(
        "registerResult"
      ).innerHTML = `
        <div class="text-[#F20A0A]">
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

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("currentUser");

  currentUser = null;

  updateLoginUI();
  updateEmployeeButtons();

  document.getElementById("LoginContainer").hidden = true;
  document.getElementById("ProfileCon").hidden = true;
  document.getElementById("accountManagement").hidden = true;

  alert("Logout success")
});


const LoginBtn = document.getElementById("LoginBtn")

if (LoginBtn) {
  LoginBtn.addEventListener("click", () => {
    document.getElementById("LoginContainer").hidden = false
    document.getElementById("registerSection").hidden = true
  })
}

const ProfileBtn = document.getElementById("ProfileBtn")

if (ProfileBtn) {
  ProfileBtn.addEventListener("click", () => {
    document.getElementById("ProfileCon").hidden = false
  })
}

const wishlistBtn = document.getElementById("wishlistBtn")

if (wishlistBtn) {
  wishlistBtn.addEventListener("click", () => {
    document.getElementById("wishlistList").hidden = false
  })
}

const accountBtn = document.getElementById("accountBtn")

if (accountBtn) {
  const roleId = Number(currentUser?.id_role)

  accountBtn.hidden = ![2004, 2005].includes(roleId)
}


document.getElementById("accountBtn")
  ?.addEventListener("click", async () => {
    const roleId = Number(currentUser?.id_role)

    if (![2004, 2005].includes(roleId)) return

    const section = document.getElementById("accountManagement")
    if (!section) return

    section.hidden = false
    await loadAllAccounts()

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
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

        alert("เข้าสู่ระบบสำเร็จ")

        currentUser = data

        console.log("Current user:", currentUser)
        console.log("Role:", currentUser.id_role)
        console.log("Employee ID:", currentUser.id_emp)

        sessionStorage.setItem(
          "currentUser",
          JSON.stringify(currentUser)
        )

        updateLoginUI()
        updateEmployeeButtons();

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
            <div class="text-[#F20A0A]">${error.message}</div>
          `
      })
  })

function updateLoginUI() {
  const isLoggedIn = currentUser !== null

  document.getElementById("LoginBtn").hidden = isLoggedIn
  document.getElementById("ProfileBtn").hidden = !isLoggedIn
  document.getElementById("logoutBtn").hidden = !isLoggedIn

  const accountBtn = document.getElementById("accountBtn")
  if (accountBtn) {
    const roleId = Number(currentUser?.id_role)
    accountBtn.hidden = !isLoggedIn || ![2004, 2005].includes(roleId)
  }
}

const productBtn = document.getElementById("productBtn");

// แสดงปุ่มเฉพาะพนักงาน
if ([2002, 2004, 2005].includes(Number(currentUser?.id_role))) {
  productBtn.hidden = false;
} else {
  productBtn.hidden = true;
}

const RegisterBtn = document.getElementById("RegisterBtn")

if (RegisterBtn) {
  RegisterBtn.addEventListener("click", () => {
    document.getElementById("registerSection").hidden = false
    document.getElementById("LoginContainer").hidden = true
  })
}