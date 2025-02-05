export function listMeasurements(info) {
  // 0 name, 1 contact,2 Height,3 waist, 4 hip, 5 Arm length, 6 chest

  const list = document.querySelector("#content");
  const listItem = document.createElement("li");

  //section one

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "X";

  const sectionOne = document.createElement("div");
  sectionOne.classList.add("section-one");

  const name = document.createElement("span");
  name.classList.add("name");
  name.textContent = info[0];

  const contact = document.createElement("span");
  contact.classList.add("contact");
  contact.textContent = info[1];

  sectionOne.append(name, deleteButton);
  listItem.append(sectionOne, contact);

  //section 2
  const sectionTwo = document.createElement("div");
  sectionTwo.classList.add("section-two");

  //change to use a for loop
  const labels = ["Height", "Waist", "Hips", "Arm Length", "Chest"];
  const edits = [];

  for (let i = 2; i < info.length; i++) {
    const container = document.createElement("div");
    container.classList.add("measurement-container");
    const label = document.createElement("span");
    label.classList.add("measurement-label");
    label.textContent = labels[i - 2] + " ✎";

    const value = document.createElement("span");
    value.classList.add("measurement-value");
    value.textContent = info[i] + `"`;

    // edit field
    const editContainer = document.createElement("div");
    editContainer.classList.add("edit-container");
    const edit = document.createElement("input");
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    editContainer.append(edit, closeButton);
    editContainer.style.display = "none";

    edit.type = "number";
    edit.value = info[i];

    edits.push({
      label,
      column: i,
      edit,
      value,
      container,
      editContainer,
      closeButton,
    });

    container.append(value, label, editContainer);
    sectionTwo.append(container, editContainer);
  }

  listItem.append(sectionTwo);
  list.prepend(listItem);
  return { edits, deleteButton, listItem };
}
export function clearContent() {
  const list = document.querySelector("#content");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
}
