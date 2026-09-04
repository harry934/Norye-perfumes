(function () {
  "use strict";

  function productUrl(code) {
    return "product.html?code=" + encodeURIComponent(code);
  }

  function renderProductCard(product, options) {
    options = options || {};
    var badge = "";
    if (options.badge === "featured") {
      badge = '<span class="norye-badge norye-badge-featured">Featured</span>';
    } else if (options.badge === "bestseller") {
      badge = '<span class="norye-badge norye-badge-bestseller">Best Seller</span>';
    }

    return (
      '<div class="col-6 col-md-4 col-lg-3">' +
        '<div class="norye-product-card h-100">' +
          '<a href="' + productUrl(product.code) + '" class="norye-product-card-image">' +
            badge +
            '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid" loading="lazy">' +
          "</a>" +
          '<div class="norye-product-card-body">' +
            '<p class="norye-product-number mb-1">' + product.number + "</p>" +
            '<h5 class="norye-product-title"><a href="' + productUrl(product.code) + '">' + product.name + "</a></h5>" +
            '<p class="norye-product-inspired">Inspired by ' + product.inspiredBy + "</p>" +
            '<p class="norye-product-price">' + product.price + "</p>" +
          "</div>" +
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
          '<a href="' + productUrl(product.code) + '" class="norye-product-card-image">' +
            badge +
            '<img src="' + product.image + '" alt="' + product.name + '" class="img-fluid" loading="lazy">' +
          "</a>" +
          '<div class="norye-product-card-body">' +
            '<p class="norye-product-number mb-1">' + product.number + "</p>" +
            '<h5 class="norye-product-title"><a href="' + productUrl(product.code) + '">' + product.name + "</a></h5>" +
            '<p class="norye-product-inspired">Inspired by ' + product.inspiredBy + "</p>" +
            '<p class="norye-product-price">' + product.price + "</p>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderGrid(containerId, products, options) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = products.map(function (p) {
      return renderProductCard(p, options);
    }).join("");
  }

  function renderSwiper(containerId, products, options) {
    var wrapper = document.querySelector("#" + containerId + " .swiper-wrapper");
    if (!wrapper) return;
    wrapper.innerHTML = products.map(function (p) {
      return renderProductSlide(p, options);
    }).join("");
  }

  function initHomepage() {
    renderSwiper("featured", getFeaturedProducts(), { badge: "featured" });
    renderSwiper("best-sellers", getBestSellers(), { badge: "bestseller" });
    renderGrid("men-grid", getProductsByCategory("men"));
    renderGrid("women-grid", getProductsByCategory("women"));

    var heroImg = document.getElementById("hero-product-image");
    var featured = getProductByCode("n23");
    if (heroImg && featured) {
      heroImg.src = featured.image;
      heroImg.alt = featured.name;
    }

    var menCatImg = document.getElementById("men-category-image");
    var womenCatImg = document.getElementById("women-category-image");
    var menProduct = getProductByCode("n23");
    var womenProduct = getProductByCode("n12");
    if (menCatImg && menProduct) menCatImg.src = menProduct.image;
    if (womenCatImg && womenProduct) womenCatImg.src = womenProduct.image;

    var searchList = document.getElementById("search-product-list");
    if (searchList) {
      searchList.innerHTML = NORYE_PRODUCTS.map(function (p) {
        return '<li class="cat-list-item"><a href="' + productUrl(p.code) + '">' + p.number + " · " + p.inspiredBy + "</a></li>";
      }).join("");
    }
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
          '<p class="mb-4">We could not find that fragrance. Browse our collection instead.</p>' +
          '<a href="index.html#featured" class="btn btn-norye-gold">View Collection</a>' +
        "</div>";
      return;
    }

    document.title = product.name + " | N Ō R Y E";

    var related = getRelatedProducts(product, 4);
    var relatedHtml = related.map(function (p) {
      return renderProductCard(p);
    }).join("");

    root.innerHTML =
      '<div class="container py-5">' +
        '<nav class="norye-breadcrumb mb-4" aria-label="breadcrumb">' +
          '<a href="index.html">Home</a>' +
          '<span>/</span>' +
          '<a href="index.html#' + product.category + '">' + product.categoryLabel + "</a>" +
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
            (product.notes ? '<p class="norye-detail-notes"><strong>Fragrance notes:</strong> ' + product.notes + "</p>" : "") +
            '<div class="d-flex flex-wrap gap-3 mt-4">' +
              '<a href="https://www.instagram.com/norye_line/" target="_blank" rel="noopener" class="btn btn-norye-gold">Order via Instagram</a>' +
              '<button type="button" class="btn btn-norye-outline" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCart">Add to Cart</button>' +
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

    var cartName = document.getElementById("cart-product-name");
    var cartDesc = document.getElementById("cart-product-desc");
    var cartPrice = document.getElementById("cart-product-price");
    if (cartName) cartName.textContent = product.name;
    if (cartDesc) cartDesc.textContent = product.size + ". Inspired by " + product.inspiredBy;
    if (cartPrice) cartPrice.textContent = product.price.replace("/=", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("product-detail-root")) {
      initProductPage();
    } else if (document.body.classList.contains("homepage")) {
      initHomepage();
    }
  });
})();
