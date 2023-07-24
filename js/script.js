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

const getData = async () => {
  const response = await fetch(`${API_URL}api/goods`);
  const data = await response.json();
  return data;
};

const createCard = (item) => {
  const cocktail = document.createElement("article");
  cocktail.classList.add("cocktail");
  cocktail.innerHTML = `
    <img src="${API_URL}${item.image}" alt="${item.title}" class="cocktail__img">
    <div class="cocktail__content">
        <div class="cocktail__text">
            <h3 class="cocktail__title">${item.title}</h3>
            <div class="cocktail__information">
                <p class="cocktail__price">${item.price} ₽</p>
                <p class="cocktail__size">${item.size}</p>
            </div>
        </div>
        <button class="btn cocktail__btn cocktail__btn_add" data-id="${item.id}">Добавить</button>
    </div>
    `;
  return cocktail;
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
    window.scroll({top: this.scrollPosition})
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

    if (target === modalElem || code === "Escape") {
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

const calculateMakeYourOwn = () => {
  const formMakeOwn = document.querySelector(".make__form_make-your-own");
  const makeInputPrice = formMakeOwn.querySelector(".make__input_price");
  const makeTotalPrice = formMakeOwn.querySelector(".make__total-price");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formMakeOwn, 150);
    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formMakeOwn.addEventListener("change", () => {
    handlerChange();
  });
};

const calculateAdd = () => {
  const modalAdd = document.querySelector(".modal_add");
  const formAdd = document.querySelector(".make__form_add");
  const makeTitle = modalAdd.querySelector(".make__title");
  const makeInputStartPrice = modalAdd.querySelector(
    ".make__input-start-price"
  );
  const makeInputTitle = modalAdd.querySelector(".make__input-title");
  const makeInputPrice = modalAdd.querySelector(".make__input-price");
  const makeTotalPrice = modalAdd.querySelector(".make__total-price");
  const makeInputSize = modalAdd.querySelector(".make__input-size");
  const makeTotalSize = modalAdd.querySelector(".make__total-size");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formAdd, +makeInputStartPrice.value);
    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formAdd.addEventListener("change", handlerChange);

  const fillInForm = (data) => {
    makeTitle.textContent = data.title;
    makeInputTitle.value = data.title;
    makeInputStartPrice.value = data.price;
    makeInputPrice.value = data.price;
    makeTotalPrice.textContent = `${data.price} ₽`;
    makeInputSize.value = data.size;
    makeTotalSize.textContent = data.size;
    handlerChange();
  };

  const resetForm = () => {
    makeTitle.textContent = "";
    makeTotalPrice.innerHTML = "";
    makeTotalSize.textContent = "";
    formAdd.reset();
  };

  return { fillInForm, resetForm };
};

const init = async () => {
  modalConroller({ modal: ".modal_order", btnOpen: ".header__btn-order" });
  modalConroller({ modal: ".modal_make", btnOpen: ".cocktail__btn_yourself" });

  calculateMakeYourOwn();

  const goodsListElem = document.querySelector(".goods__list");
  const data = await getData();
  
  const cartCocktail = data.map((item) => {
    const li = document.createElement("li");
    li.classList.add("goods__item");
    li.append(createCard(item));
    return li;
  });

  goodsListElem.append(...cartCocktail);

  const { fillInForm, resetForm } = calculateAdd();

  modalConroller({
    modal: ".modal_add",
    btnOpen: ".cocktail__btn_add",
    open({ btn }) {
      const id = btn.dataset.id;
      const item = data.find((item) => item.id.toString() === id);
      fillInForm(item);
    },
    close: resetForm,
  });
};

init();
