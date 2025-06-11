document.addEventListener("DOMContentLoaded", function () {
  const ticketPrice = parseFloat(document.getElementById("ticketPrice").value);
  const ticketQuantity = document.getElementById("ticketQuantity");
  const totalAmountInput = document.getElementById("totalAmount");

  function updateTotal() {
      const quantity = parseInt(ticketQuantity.value);
      const total = ticketPrice * quantity;
      totalAmountInput.value = isNaN(total) ? '' : total;
  }

  ticketQuantity.addEventListener("change", updateTotal);

  // Set initial value on page load
  updateTotal();
});
