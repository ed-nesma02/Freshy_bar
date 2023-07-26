const API_URL = "https://freshy-bar-api.glitch.me/"; //https://freshy-bar-api.glitch.me/

const price = {
  Клубника: 60,
  Банан: 50,
  Манго: 70,
  Киви: 55,
  Маракуйя: 90,
  Яблоко: 45,
  Мята: 50,
  Лед: 10,
  Биоразлагаемый: 20,
  Пластиковый: 0,
};

const cartDataControl = {
  get() {
    return JSON.parse(localStorage.getItem("FreshyBarCart") || "[]");
  },
  add(item) {
    const cartData = this.get();
    item.idls = Math.random().toString(36).substring(2, 8);
    cartData.push(item);
    localStorage.setItem("FreshyBarCart", JSON.stringify(cartData));
    initCountCart(cartData.length);
    refreshBtnCount();
  },
  remove(idls) {
    const cartData = this.get();
    const index = cartData.findIndex((item) => item.idls === idls);
    if (index !== -1) {
      cartData.splice(index, 1);
    }
    localStorage.setItem("FreshyBarCart", JSON.stringify(cartData));
    initCountCart(cartData.length);
    refreshBtnCount();
  },
  clear() {
    localStorage.removeItem("FreshyBarCart");
    initCountCart(0);
    refreshBtnCount();
  },
};

const getData = async () => {
  const response = await fetch(`${API_URL}api/goods`);
  const data = await response.json();
  return data;
};

const createCard = (item) => {
  let countItem = 0;
  cartDataControl.get().forEach((title) => {
    if (title.title === item.title) {
      countItem += 1;
    }
  });

  const cocktail = document.createElement("article");
  cocktail.classList.add("cocktail");
  cocktail.innerHTML = `
    <img src="${API_URL}${item.image}" alt="${
    item.title
  }" class="cocktail__img">
    <div class="cocktail__content">
        <div class="cocktail__text">
            <h3 class="cocktail__title">${item.title}</h3>
            <div class="cocktail__information">
                <p class="cocktail__price">${item.price} ₽</p>
                <p class="cocktail__size">${item.size}</p>
            </div>
        </div>
        ${
          countItem
            ? `<button class="btn_active cocktail__btn cocktail__btn_add" data-id="${item.id}">В корзине<sup>(${countItem})</sup></button>`
            : `<button class="btn cocktail__btn cocktail__btn_add" data-id="${item.id}">Добавить</button>`
        }
    </div>
    `;
  return cocktail;
};

const refreshBtnCount = async () => {
  const liItem = document.querySelectorAll(".goods__item");
  liItem.forEach((item) => {
    let countItem = 0;
    const btnItem = item.querySelector(".cocktail__btn_add");
    const inputTitle = item.querySelector(".cocktail__title");
    cartDataControl.get().forEach((title) => {
      if (title.title === inputTitle.textContent) {
        countItem += 1;
      }
    });

    if (btnItem && countItem) {
      btnItem.innerHTML = `В корзине<sup>(${countItem})`;
      btnItem.classList.remove("btn");
      btnItem.classList.add("btn_active");
    } else if (btnItem) {
      btnItem.classList.add("btn");
      btnItem.classList.remove("btn_active");
      btnItem.innerHTML = "Добавить";
    }
  });
};

const scrollService = {
  scrollPosition: 0,
  disabledScroll() {
    this.scrollPosition = window.scrollY;
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.cssText = `
    overflow: hidden;
    position: fixed;
    top: -${this.scrollPosition}px;
    left: 0;
    width: 100vw;
    padding-right: ${window.innerWidth - document.body.offsetWidth}px;
    `;
  },
  enabledScroll() {
    document.body.style.cssText = "";
    window.scroll({ top: this.scrollPosition });
    document.documentElement.style.scrollBehavior = "";
  },
};

const modalConroller = ({ modal, btnOpen, time = 300, open, close }) => {
  const buttonElems = document.querySelectorAll(btnOpen);
  const modalElem = document.querySelector(modal);
  modalElem.style.cssText = `
      display: flex;
      visibility: hidden;
      opacity: 0;
      transition: opacity ${time}ms ease-in-out;
      `;

  const openModal = (e) => {
    if (open) {
      open({ btn: e.target });
    }
    modalElem.style.visibility = "visible";
    modalElem.style.opacity = "1";
    window.addEventListener("keydown", closeModal);
    scrollService.disabledScroll();
  };
  const closeModal = (event) => {
    const target = event.target;
    const code = event.code;

    if (event === "close" || target === modalElem || code === "Escape") {
      modalElem.style.opacity = "0";
      setTimeout(() => {
        modalElem.style.visibility = "hidden";
        scrollService.enabledScroll();
        if (close) {
          close();
        }
      }, time);
    }
    window.removeEventListener("keydown", closeModal);
  };
  buttonElems.forEach((buttonElem) => {
    buttonElem.addEventListener("click", openModal);
  });
  modalElem.addEventListener("click", closeModal);

  modalElem.openModal = openModal;
  modalElem.closeModal = closeModal;

  return { openModal, closeModal };
};

const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  for (const [name, value] of formData.entries()) {
    if (data[name]) {
      if (!Array.isArray(data[name])) {
        data[name] = [data[name]];
      }
      data[name].push(value);
    } else {
      data[name] = value;
    }
  }
  return data;
};

const calculateTotalPrice = (form, startPrice) => {
  let totalPrice = startPrice;

  const data = getFormData(form);

  if (Array.isArray(data.ingredients)) {
    data.ingredients.forEach((item) => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.ingredients] || 0;
  }

  if (Array.isArray(data.topping)) {
    data.topping.forEach((item) => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.topping] || 0;
  }
  totalPrice += price[data.cup] || 0;

  return totalPrice;
};

const formControl = (form, cb) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData(form);
    cartDataControl.add(data);

    if (cb) {
      cb();
    }
  });
};

const calculateMakeYourOwn = () => {
  const modalMake = document.querySelector(".modal_make");
  const makeInputTitle = modalMake.querySelector(".make__input-title");
  const formMakeOwn = modalMake.querySelector(".make__form_make-your-own");
  const makeInputPrice = modalMake.querySelector(".make__input_price");
  const makeTotalPrice = modalMake.querySelector(".make__total-price");
  const makeAddBbtn = modalMake.querySelector(".make__add-btn");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formMakeOwn, 150);

    const data = getFormData(formMakeOwn);

    if (data.ingredients) {
      const ingredients = Array.isArray(data.ingredients)
        ? data.ingredients.join(", ")
        : data.ingredients;

      makeInputTitle.value = `Конструктор: ${ingredients}`;
      makeAddBbtn.disabled = false;
    } else {
      makeAddBbtn.disabled = true;
    }

    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formMakeOwn.addEventListener("change", handlerChange);
  formControl(formMakeOwn, () => {
    modalMake.closeModal("close");
  });
  handlerChange();

  const resetForm = () => {
    makeTotalPrice.textContent = "150";
    makeAddBbtn.disabled = true;
    formMakeOwn.reset();
  };

  return { resetForm };
};

const calculateAdd = () => {
  const modalAdd = document.querySelector(".modal_add");
  const formAdd = modalAdd.querySelector(".make__form_add");
  const makeTitle = modalAdd.querySelector(".make__title");
  const makeInputStartPrice = modalAdd.querySelector(
    ".make__input-start-price"
  );
  const makeInputTitle = modalAdd.querySelector(".make__input-title");
  const makeInputPrice = modalAdd.querySelector(".make__input-price");
  const makeTotalPrice = modalAdd.querySelector(".make__total-price");
  const makeInputSize = modalAdd.querySelector(".make__input-size");
  const makeTotalSize = modalAdd.querySelector(".make__total-size");
  const makeInputImg = modalAdd.querySelector(".make__input-img");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formAdd, +makeInputStartPrice.value);
    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formAdd.addEventListener("change", handlerChange);
  formControl(formAdd, () => {
    modalAdd.closeModal("close");
  });

  const fillInForm = (data) => {
    makeTitle.textContent = data.title;
    makeInputTitle.value = data.title;
    makeInputStartPrice.value = data.price;
    makeInputPrice.value = data.price;
    makeTotalPrice.textContent = `${data.price} ₽`;
    makeInputSize.value = data.size;
    makeTotalSize.textContent = data.size;
    makeInputImg.value = data.image;
    handlerChange();
  };

  const resetForm = () => {
    makeTitle.textContent = "";
    makeTotalPrice.textContent = "";
    makeTotalSize.textContent = "";
    formAdd.reset();
  };

  return { fillInForm, resetForm };
};

const createCartItem = (item) => {
  const li = document.createElement("li");
  li.classList.add("order__item");
  li.innerHTML = `
  <img src="${
    item.img ? `${API_URL}${item.img}` : "img/make-your-own.png"
  }" alt="${item.title}" class="order__img">
  <div class="order__info">
      <h3 class="order__name">${item.title}</h3>
      <ul class="order__topping-list">
          <li class="order__topping-item">${item.size}</li>
          <li class="order__topping-item">${item.cup}</li>
          ${
            item.topping
              ? Array.isArray(item.topping)
                ? item.topping
                    .map(
                      (topping) =>
                        `<li class="order__topping-item">${topping}</li>`
                    )
                    .toString()
                    .replace(",", "")
                : `<li class="order__topping-item">${item.topping}</li>`
              : ""
          }
      </ul>
  </div>
  <button class="order__item-delete" aria-label="Удалить коктейл из корзины" data-idls="${
    item.idls
  }">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_26_867)">
    <path d="M12.9401 11.9821L18.4667 6.47024C18.5759 6.34304 18.633 6.17943 18.6265 6.0121C18.6201 5.84476 18.5505 5.68603 18.4318 5.56762C18.313 5.4492 18.1539 5.37984 17.9861 5.37337C17.8183 5.36691 17.6543 5.42383 17.5267 5.53275L12.0001 11.0446L6.4734 5.5261C6.34786 5.4009 6.1776 5.33057 6.00006 5.33057C5.82253 5.33057 5.65227 5.4009 5.52673 5.5261C5.40119 5.6513 5.33067 5.82111 5.33067 5.99817C5.33067 6.17523 5.40119 6.34504 5.52673 6.47024L11.0601 11.9821L5.52673 17.494C5.45694 17.5536 5.40026 17.627 5.36025 17.7095C5.32023 17.7919 5.29774 17.8818 5.2942 17.9734C5.29065 18.0649 5.30612 18.1562 5.33964 18.2416C5.37315 18.3269 5.42399 18.4044 5.48896 18.4692C5.55393 18.534 5.63163 18.5847 5.71718 18.6181C5.80273 18.6515 5.89429 18.6669 5.9861 18.6634C6.07791 18.6599 6.168 18.6374 6.25071 18.5975C6.33342 18.5576 6.40697 18.5011 6.46673 18.4315L12.0001 12.9196L17.5267 18.4315C17.6543 18.5404 17.8183 18.5973 17.9861 18.5909C18.1539 18.5844 18.313 18.515 18.4318 18.3966C18.5505 18.2782 18.6201 18.1195 18.6265 17.9521C18.633 17.7848 18.5759 17.6212 18.4667 17.494L12.9401 11.9821Z" fill="#D5B4A8"/>
    </g>
    <defs>
    <clipPath id="clip0_26_867">
    <rect width="24" height="24" fill="white"/>
    </clipPath>
    </defs>
  </svg>
  </button>
  <p class="order__item-price">${item.price}&nbsp;₽</p>
  `;

  return li;
};

const renderCart = () => {
  const modalOrder = document.querySelector(".modal_order");
  const orderCount = modalOrder.querySelector(".order-count");
  const orderList = modalOrder.querySelector(".order__list");
  const orderTotalPrice = modalOrder.querySelector(".order__total-price");
  const orderForm = modalOrder.querySelector(".order__form");

  const orderListData = cartDataControl.get();

  orderList.textContent = "";
  orderCount.textContent = `(${orderListData.length})`;
  orderListData.forEach((item) => {
    orderList.append(createCartItem(item));
  });

  orderTotalPrice.textContent = `${orderListData.reduce(
    (acc, item) => acc + +item.price,
    0
  )} ₽`;

  const orderItemDelete = modalOrder.querySelectorAll(".order__item-delete");
  orderItemDelete.forEach((item) => {
    item.addEventListener("click", () => {
      cartDataControl.remove(item.dataset.idls);
      renderCart();
    });
  });

  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!orderListData.length) {
      return alert("Корзина пустая");
    } else {
      const data = getFormData(orderForm);
      const response = await fetch(`${API_URL}api/order`, {
        method: "Post",
        body: JSON.stringify({
          ...data,
          products: orderListData,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      cartDataControl.clear();
      orderForm.reset();
      modalOrder.closeModal("close");
    }
  });
};

const initCountCart = (count) => {
  const headerBtnOrder = document.querySelector(".header__btn-order");
  headerBtnOrder.dataset.count = count || cartDataControl.get().length;
};

const init = async () => {
  initCountCart();
  modalConroller({
    modal: ".modal_order",
    btnOpen: ".header__btn-order",
    open: renderCart,
  });

  const { resetForm: resetFormMakeYourOwn } = calculateMakeYourOwn();

  modalConroller({
    modal: ".modal_make",
    btnOpen: ".cocktail__btn_yourself",
    close: resetFormMakeYourOwn,
  });

  const goodsListElem = document.querySelector(".goods__list");
  const data = await getData();

  const cartCocktail = data.map((item) => {
    const li = document.createElement("li");
    li.classList.add("goods__item");
    li.append(createCard(item));
    return li;
  });

  goodsListElem.append(...cartCocktail);

  const { fillInForm: fillInFormAdd, resetForm: resetFormAdd } = calculateAdd();

  modalConroller({
    modal: ".modal_add",
    btnOpen: ".cocktail__btn_add",
    open({ btn }) {
      const id = btn.dataset.id;
      const item = data.find((item) => item.id.toString() === id);
      fillInFormAdd(item);
    },
    close: resetFormAdd,
  });
};

init();
