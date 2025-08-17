/**
 * @description Calculates the order summary from a list of items.
 * @param {Array} items - The list of items (from cart or wishlist).
 * @returns {object} An object with formatted items and the total price.
 */
export const calculateOrderSummary = (items = []) => {
  if (!items || items.length === 0) {
    return { items: [], total: 0 };
  }

  const formattedItems = items.map((item) => {
    let selectedOption = null;
    if (Array.isArray(item.options) && item.options.length > 0) {
      selectedOption =
        item.options.find(
          (opt) =>
            (item.unit && opt.unit === item.unit) &&
            (item.unitSize && opt.unitSize == item.unitSize)
        ) || item.options[0];
    } else {
      selectedOption = {};
    }

    const price = selectedOption.sellingPrice || item.price || item.sellingPrice || 0;
    const quantity = item.quantity || item.qty || 1;

    return {
      name: item.name,
      qty: quantity,
      price: price,
      unit: selectedOption.unit || item.unit || "",
      unitSize: selectedOption.unitSize || item.unitSize || "",
      // Provide option context so the summary can resolve MRP correctly
      option: selectedOption,
      options: Array.isArray(item.options) ? item.options : [],
      imageUrl:
        Array.isArray(item.imageUrls) && item.imageUrls.length > 0
          ? item.imageUrls[0]
          : item.imageUrl || "https://via.placeholder.com/64",
    };
  });

  const total = formattedItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return {
    items: formattedItems,
    total,
  };
};
