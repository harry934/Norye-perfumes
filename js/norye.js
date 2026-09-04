(function () {
  "use strict";

  var CART_KEY = "norye-cart";
  var CHECKOUT_KEY = "norye-checkout";
  var ITEM_PRICE = 1299;

  function productUrl(code) {
    return "product.html?code=" + encodeURIComponent(code);
  }

  function collectionUrl(category) {
    return category === "men" ? "men.html" : "women.html";
  }

  function orderUrl() {
    if (typeof NORYE_WHATSAPP_PHONE !== "undefined" && NORYE_WHATSAPP_PHONE) {
      return "https://wa.me/" + NORYE_WHATSAPP_PHONE;
    }
    return typeof NORYE_ORDER_URL !== "undefined" ? NORYE_ORDER_URL : "https://wa.me/254721754234";
  }

  function buildOrderMessage(checkout) {
    var cart = getCart();
    var lines = ["*N Ō R Y E Order*", "", "Items:"];

    cart.forEach(function (item) {
      var product = getProductByCode(item.code);
      if (!product) return;
      lines.push(
        "- " + product.number + " · " + product.inspiredBy +
        " x" + item.qty + " — " + formatPrice(item.qty * ITEM_PRICE)
      );
    });

    lines.push("");
    lines.push("Total: " + formatPrice(getCartTotal(cart)));
    lines.push("");
    lines.push("Name: " + checkout.name);
    lines.push("Phone: " + checkout.phone);
    lines.push("Delivery: " + checkout.location);
    if (checkout.notes) {
      lines.push("Notes: " + checkout.notes);
    }

    return lines.join("\n");
  }

  function buildWhatsAppOrderUrl(checkoutOverride) {
    var checkout = checkoutOverride || getCheckout();
    return orderUrl() + "?text=" + encodeURIComponent(buildOrderMessage(checkout));
  }

  function normalizeCart(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(function (item) {
      if (typeof item === "string") {
        return { code: item, qty: 1 };
      }
      if (item && item.code) {
        return { code: item.code, qty: Math.max(1, parseInt(item.qty, 10) || 1) };
      }
      return null;
    }).filter(Boolean);
  }

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? normalizeCart(JSON.parse(raw)) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function getCheckout() {
    try {
      var raw = localStorage.getItem(CHECKOUT_KEY);
      return raw ? JSON.parse(raw) : { name: "", phone: "", location: "", notes: "" };
    } catch (e) {
      return { name: "", phone: "", location: "", notes: "" };
    }
  }

  function saveCheckout(data) {
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify(data));
  }

  function getCartItemCount(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function getCartTotal(cart) {
    return cart.reduce(function (sum, item) {
      return sum + item.qty * ITEM_PRICE;
    }, 0);
  }

  function findCartItem(cart, code) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].code === code) return cart[i];
    }
    return null;
  }

  function openCartPanel() {
    var el = document.getElementById("offcanvasCart");
    if (el && typeof bootstrap !== "undefined") {
      bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }
  }

  function addToCart(code, options) {
    options = options || {};
    var cart = getCart();
    var existing = findCartItem(cart, code);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ code: code, qty: 1 });
    }
    saveCart(cart);
    renderCartUI();
    if (options.openCart) openCartPanel();
    if (options.button) {
      var btn = options.button;
      var original = btn.textContent;
      btn.textContent = "Added";
      btn.classList.add("is-added");
      window.setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("is-added");
      }, 1400);
    }
  }

  function removeFromCart(code) {
    var cart = getCart().filter(function (item) {
      return item.code !== code;
    });
    saveCart(cart);
    renderCartUI();
  }

  function updateCartQty(code, delta) {
    var cart = getCart();
    var item = findCartItem(cart, code);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (i) {
        return i.code !== code;
      });
    }
    saveCart(cart);
    renderCartUI();
  }

  function formatPrice(amount) {
    return "Ksh " + amount.toLocaleString();
  }

  function renderCartUI() {
    var cart = getCart();
    var count = getCartItemCount(cart);

    document.querySelectorAll(".cart-count").forEach(function (el) {
      el.textContent = count > 0 ? String(count) : "";
    });

    var badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = count > 0 ? String(count) : "";
    }

    var list = document.getElementById("cart-items-list");
    var empty = document.getElementById("cart-empty");
    var footer = document.getElementById("cart-footer");
    var totalEl = document.getElementById("cart-total");
    var errorEl = document.getElementById("checkout-error");

    if (!list) return;

    if (count === 0) {
      list.innerHTML = "";
      if (empty) empty.style.display = "block";
      if (footer) footer.style.display = "none";
      if (errorEl) errorEl.textContent = "";
      return;
    }

    if (empty) empty.style.display = "none";
    if (footer) footer.style.display = "block";
    if (errorEl) errorEl.textContent = "";

    list.innerHTML = cart.map(function (item) {
      var product = getProductByCode(item.code);
      if (!product) return "";
      return (
        '<li class="list-group-item norye-cart-item">' +
          '<div class="d-flex justify-content-between align-items-start gap-2">' +
            '<div class="norye-cart-item-info">' +
              '<h6 class="my-0">' + product.number + "</h6>" +
              '<small class="text-body-secondary">Inspired by ' + product.inspiredBy + "</small>" +
            "</div>" +
            '<span class="text-body-secondary text-nowrap">' + formatPrice(item.qty * ITEM_PRICE) + "</span>" +
          "</div>" +
          '<div class="norye-cart-qty mt-2">' +
            '<button type="button" class="norye-qty-btn" data-qty-minus="' + product.code + '" aria-label="Decrease quantity">−</button>' +
            '<span class="norye-qty-value">' + item.qty + "</span>" +
            '<button type="button" class="norye-qty-btn" data-qty-plus="' + product.code + '" aria-label="Increase quantity">+</button>' +
            '<button type="button" class="norye-cart-remove ms-auto" data-remove-cart="' + product.code + '">Remove</button>' +
          "</div>" +
        "</li>"
      );
    }).join("");

    if (totalEl) {
      totalEl.textContent = formatPrice(getCartTotal(cart));
    }
  }

  function initCheckoutForm() {
    var checkout = getCheckout();
    var fields = {
      "checkout-name": checkout.name,
      "checkout-phone": checkout.phone,
      "checkout-location": checkout.location,
      "checkout-notes": checkout.notes
    };

    Object.keys(fields).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = fields[id] || "";
    });

    var form = document.getElementById("cart-checkout-form");
    if (!form) return;

    form.addEventListener("input", function () {
      saveCheckout({
        name: (document.getElementById("checkout-name") || {}).value || "",
        phone: (document.getElementById("checkout-phone") || {}).value || "",
        location: (document.getElementById("checkout-location") || {}).value || "",
        notes: (document.getElementById("checkout-notes") || {}).value || ""
      });
    });

    var orderBtn = document.getElementById("cart-order-btn");
    if (orderBtn) {
      orderBtn.addEventListener("click", function () {
        var name = (document.getElementById("checkout-name") || {}).value || "";
        var phone = (document.getElementById("checkout-phone") || {}).value || "";
        var location = (document.getElementById("checkout-location") || {}).value || "";
        var notes = (document.getElementById("checkout-notes") || {}).value || "";
        var errorEl = document.getElementById("checkout-error");

        saveCheckout({ name: name, phone: phone, location: location, notes: notes });

        if (!name.trim() || !phone.trim() || !location.trim()) {
          if (errorEl) {
            errorEl.textContent = "Please enter your name, phone, and delivery location.";
          }
          return;
        }

        if (getCartItemCount(getCart()) === 0) {
          if (errorEl) errorEl.textContent = "Your cart is empty.";
          return;
        }

        var checkout = { name: name, phone: phone, location: location, notes: notes };
        var message = buildOrderMessage(checkout);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(message).catch(function () {});
        }

        if (errorEl) {
          errorEl.textContent = "Opening WhatsApp with your order details…";
        }

        window.open(buildWhatsAppOrderUrl(checkout), "_blank", "noopener");
      });
    }
  }

  function bindCartEvents() {
    document.body.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add-cart]");
      if (addBtn) {
        e.preventDefault();
        addToCart(addBtn.getAttribute("data-add-cart"), {
          button: addBtn,
          openCart: addBtn.hasAttribute("data-open-cart")
        });
        return;
      }
      var minusBtn = e.target.closest("[data-qty-minus]");
      if (minusBtn) {
        e.preventDefault();
        updateCartQty(minusBtn.getAttribute("data-qty-minus"), -1);
        return;
      }
      var plusBtn = e.target.closest("[data-qty-plus]");
      if (plusBtn) {
        e.preventDefault();
        updateCartQty(plusBtn.getAttribute("data-qty-plus"), 1);
        return;
      }
      var removeBtn = e.target.closest("[data-remove-cart]");
      if (removeBtn) {
        e.preventDefault();
        removeFromCart(removeBtn.getAttribute("data-remove-cart"));
      }
    });
  }

  function filterProducts(query) {
    query = (query || "").trim().toLowerCase();
    if (!query) return NORYE_PRODUCTS.slice();
    return NORYE_PRODUCTS.filter(function (p) {
      return (
        p.number.toLowerCase().indexOf(query) !== -1 ||
        p.name.toLowerCase().indexOf(query) !== -1 ||
        p.inspiredBy.toLowerCase().indexOf(query) !== -1 ||
        p.code.toLowerCase().indexOf(query) !== -1
      );
    });
  }

  function renderSearchResults(products) {
    var list = document.getElementById("search-product-list");
    if (!list) return;

    if (!products.length) {
      list.innerHTML = '<li class="search-no-results">No perfumes found</li>';
      return;
    }

    list.innerHTML = products.map(function (p) {
      return (
        '<li class="cat-list-item">' +
          '<a href="' + productUrl(p.code) + '" data-product-code="' + p.code + '">' +
            '<span class="norye-search-number">' + p.number + "</span>" +
            '<span class="norye-search-inspired">Inspired by ' + p.inspiredBy + "</span>" +
          "</a>" +
        "</li>"
      );
    }).join("");
  }

  function navigateToProduct(code) {
    window.location.href = productUrl(code);
  }

  function closeSearchPopup() {
    var popup = document.querySelector(".search-popup");
    if (popup) popup.classList.remove("is-visible");
  }

  function initSearch() {
    var input = document.getElementById("search-form");
    var form = input ? input.closest("form") : null;
    var list = document.getElementById("search-product-list");
    var popup = document.querySelector(".search-popup");
    var closeBtn = document.querySelector(".search-popup-close");

    if (!input || !list) return;

    renderSearchResults(NORYE_PRODUCTS);

    input.addEventListener("input", function () {
      renderSearchResults(filterProducts(input.value));
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var results = filterProducts(input.value);
        if (results.length >= 1) {
          navigateToProduct(results[0].code);
        } else {
          renderSearchResults(results);
        }
      });
    }

    list.addEventListener("click", function (e) {
      var link = e.target.closest("a[data-product-code]");
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      closeSearchPopup();
      navigateToProduct(link.getAttribute("data-product-code"));
    });

    document.querySelectorAll(".search-button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.setTimeout(function () {
          if (popup && popup.classList.contains("is-visible")) {
            input.value = "";
            renderSearchResults(NORYE_PRODUCTS);
            input.focus();
          }
        }, 50);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeSearchPopup();
      });
    }

    if (popup) {
      popup.addEventListener("click", function (e) {
        if (e.target === popup) closeSearchPopup();
      });
    }
  }

  function renderProductCardMedia(product, badge) {
    return (
      '<div class="norye-product-card-media">' +
        '<a href="' + productUrl(product.code) + '" class="norye-product-card-image">' +
          badge +
          '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid" loading="lazy">' +
        "</a>" +
        '<button type="button" class="norye-add-cart" data-add-cart="' + product.code + '" data-open-cart>Add to Cart</button>' +
      "</div>"
    );
  }

  function renderProductCardBody(product) {
    return (
      '<div class="norye-product-card-body">' +
        '<h5 class="norye-product-title"><a href="' + productUrl(product.code) + '">' + product.number + "</a></h5>" +
        '<div class="norye-product-card-meta">' +
          '<p class="norye-product-inspired">Inspired by ' + product.inspiredBy + "</p>" +
          '<p class="norye-product-price">' + product.price + "</p>" +
        "</div>" +
        '<a href="' + productUrl(product.code) + '" class="norye-product-details">View Details</a>' +
      "</div>"
    );
  }

  function renderProductCard(product, options) {
    options = options || {};
    var badge = "";
    if (options.badge === "featured") {
      badge = '<span class="norye-badge norye-badge-featured">Featured</span>';
    } else if (options.badge === "bestseller") {
      badge = '<span class="norye-badge norye-badge-bestseller">Best Seller</span>';
    }

    var colClass = "col-6 col-md-4 col-lg-3";
    var colAttrs = 'class="' + colClass;
    if (options.animate) {
      colAttrs += ' norye-card-reveal" style="--reveal-delay: ' + ((options.index || 0) * 80) + 'ms"';
    } else {
      colAttrs += '"';
    }

    return (
      "<div " + colAttrs + ">" +
        '<div class="norye-product-card h-100">' +
          renderProductCardMedia(product, badge) +
          renderProductCardBody(product) +
        "</div>" +
      "</div>"
    );
  }

  function renderProductSlide(product, options) {
    options = options || {};
    var badge = options.badge === "featured"
      ? '<span class="norye-badge norye-badge-featured">Featured</span>'
      : options.badge === "bestseller"
        ? '<span class="norye-badge norye-badge-bestseller">Best Seller</span>'
        : "";

    return (
      '<div class="swiper-slide">' +
        '<div class="norye-product-card norye-product-card-slide h-100">' +
          renderProductCardMedia(product, badge) +
          renderProductCardBody(product) +
        "</div>" +
      "</div>"
    );
  }

  function renderGrid(containerId, products, options) {
    options = options || {};
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = products.map(function (p, index) {
      return renderProductCard(p, Object.assign({}, options, { index: index }));
    }).join("");
  }

  function renderSwiper(containerId, products, options) {
    var wrapper = document.querySelector("#" + containerId + " .swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = products.map(function (p) {
      return renderProductSlide(p, options);
    }).join("");
  }

  function initIntroAnimations() {
    var preloader = document.querySelector(".preloader");

    document.body.classList.add("norye-loading");

    window.setTimeout(function () {
      if (preloader) {
        preloader.classList.add("loaded");
      }
      document.body.classList.remove("norye-loading");
      document.body.classList.add("norye-ready");

      document.querySelectorAll("#billboard [data-aos]").forEach(function (el) {
        el.classList.add("aos-animate");
      });

      if (typeof AOS !== "undefined") {
        AOS.init({ once: true, duration: 700, offset: 60 });
      }
    }, 1200);
  }

  function dismissPreloader() {
    var preloader = document.querySelector(".preloader");
    if (preloader) {
      preloader.classList.add("loaded");
    }
  }

  function initGlobal() {
    bindCartEvents();
    initSearch();
    initCheckoutForm();
    initNavDropdownHover();
    renderCartUI();
    if (!document.body.classList.contains("homepage")) {
      dismissPreloader();
    }
    window.addEventListener("load", dismissPreloader);
  }

  function initHomepage() {
    renderSwiper("featured", getFeaturedProducts(), { badge: "featured" });
    renderSwiper("best-sellers", getBestSellers(), { badge: "bestseller" });

    var menCatImg = document.getElementById("men-category-image");
    var womenCatImg = document.getElementById("women-category-image");
    var menProduct = getProductByCode("n23");
    var womenProduct = getProductByCode("n12");
    if (menCatImg && menProduct) menCatImg.src = menProduct.image;
    if (womenCatImg && womenProduct) womenCatImg.src = womenProduct.image;

    initIntroAnimations();
    window.addEventListener("load", initProductCarousels);
  }

  function initProductCarousels() {
    if (typeof Swiper === "undefined") return;

    var carouselIds = ["featured", "best-sellers"];

    carouselIds.forEach(function (id) {
      var swiperEl = document.querySelector("#" + id + " .swiper");
      if (!swiperEl) return;

      if (swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }

      new Swiper("#" + id + " .swiper", {
        slidesPerView: 4,
        spaceBetween: 20,
        preventClicks: false,
        preventClicksPropagation: false,
        navigation: {
          nextEl: "#" + id + " .icon-arrow-right",
          prevEl: "#" + id + " .icon-arrow-left"
        },
        pagination: {
          el: "#" + id + " .swiper-pagination",
          clickable: true
        },
        breakpoints: {
          0: {
            slidesPerView: 2,
            spaceBetween: 20,
            pagination: {
              el: "#" + id + " .swiper-pagination",
              clickable: true
            }
          },
          999: { slidesPerView: 3, spaceBetween: 10 },
          1366: { slidesPerView: 4, spaceBetween: 40 }
        }
      });
    });
  }

  function revealAosElements() {
    document.querySelectorAll("[data-aos]").forEach(function (el) {
      el.classList.add("aos-animate");
    });
    if (typeof AOS !== "undefined") {
      AOS.init({ once: true, duration: 700, offset: 60 });
      AOS.refresh();
    }
  }

  function initPageReveal(callback) {
    document.body.classList.add("norye-page-loading");

    window.setTimeout(function () {
      document.body.classList.remove("norye-page-loading");
      document.body.classList.add("norye-page-ready");
      revealAosElements();
      if (typeof callback === "function") {
        callback();
      }
    }, 150);
  }

  function initImageLoadFade(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var images = scope.querySelectorAll(".norye-product-card-image img, .norye-detail-image img");

    images.forEach(function (img) {
      function markLoaded() {
        img.classList.add("is-loaded");
        var wrapper = img.closest(".norye-product-card-image, .norye-detail-image");
        if (wrapper) wrapper.classList.add("is-loaded");
      }

      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener("load", markLoaded);
        img.addEventListener("error", markLoaded);
      }
    });
  }

  function initNavDropdownHover() {
    if (window.matchMedia("(max-width: 991.98px)").matches) return;

    document.querySelectorAll(".norye-navbar-center .dropdown-toggle").forEach(function (toggle) {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
      });
    });
  }

  function initCollectionPage() {
    var category = document.body.dataset.collection;
    if (!category) return;

    renderGrid("collection-grid", getProductsByCategory(category), { animate: true });
    initImageLoadFade(document.getElementById("collection-grid"));
    initPageReveal();
  }

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function initProductPage() {
    var root = document.getElementById("product-detail-root");
    if (!root) return;

    var code = getQueryParam("code");
    var product = getProductByCode(code);

    if (!product) {
      root.innerHTML =
        '<div class="container py-5 text-center">' +
          '<h2 class="section-title">Product not found</h2>' +
          '<p class="mb-4">We could not find that perfume. Browse our collection instead.</p>' +
          '<a href="index.html#featured" class="btn btn-norye-gold">View Collection</a>' +
        "</div>";
      initPageReveal();
      return;
    }

    document.title = product.name + " | N Ō R Y E";

    var related = getRelatedProducts(product, 4);
    var relatedHtml = related.map(function (p, index) {
      return renderProductCard(p, { animate: true, index: index });
    }).join("");

    root.innerHTML =
      '<div class="container py-5">' +
        '<nav class="norye-breadcrumb mb-4" aria-label="breadcrumb">' +
          '<a href="index.html">Home</a>' +
          '<span>/</span>' +
          '<a href="' + collectionUrl(product.category) + '">' + product.categoryLabel + "</a>" +
          '<span>/</span>' +
          "<span>" + product.number + "</span>" +
        "</nav>" +
        '<div class="row g-5 align-items-start">' +
          '<div class="col-lg-6">' +
            '<div class="norye-detail-image">' +
              '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid">' +
            "</div>" +
          "</div>" +
          '<div class="col-lg-6">' +
            '<p class="norye-product-number">' + product.number + "</p>" +
            '<h1 class="norye-detail-title">' + product.name + "</h1>" +
            '<p class="norye-detail-inspired">Inspired by ' + product.inspiredBy + "</p>" +
            '<p class="norye-detail-meta">' + product.categoryLabel + " · " + product.size + "</p>" +
            '<p class="norye-detail-price">' + product.price + "</p>" +
            '<p class="norye-detail-description">' + product.description + "</p>" +
            (product.notes ? '<p class="norye-detail-notes"><strong>Perfume notes:</strong> ' + product.notes + "</p>" : "") +
            '<div class="d-flex flex-wrap gap-3 mt-4">' +
              '<button type="button" class="btn btn-norye-gold" data-add-cart="' + product.code + '" data-open-cart>Add to Cart</button>' +
              '<button type="button" class="btn btn-norye-outline" id="detail-open-cart">View Cart</button>' +
            "</div>" +
          "</div>" +
        "</div>" +
        (related.length
          ? '<section class="mt-5 pt-5 border-top">' +
              '<h3 class="section-title text-uppercase mb-4">You May Also Like</h3>' +
              '<div class="row g-4">' + relatedHtml + "</div>" +
            "</section>"
          : "") +
      "</div>";

    var openCartBtn = document.getElementById("detail-open-cart");
    if (openCartBtn) {
      openCartBtn.addEventListener("click", openCartPanel);
    }

    initImageLoadFade(root);
    initPageReveal();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initGlobal();

    if (document.getElementById("product-detail-root")) {
      initProductPage();
    } else if (document.body.classList.contains("homepage")) {
      initHomepage();
    } else if (document.body.classList.contains("collection-page")) {
      initCollectionPage();
    }
  });
})();
