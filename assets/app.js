function agregarCategoria() {
    const categoriasContainer = document.getElementById('categorias');
  
    // Solicitar el nombre de la nueva categoría
    const nuevaCategoria = prompt('Ingrese el nombre de la nueva categoría:');
  
    // Validar que el usuario haya ingresado un nombre
    if (nuevaCategoria && nuevaCategoria.trim() !== '') {
      // Crear un nuevo elemento div para la categoría
      const nuevaCategoriaDiv = document.createElement('div');
      nuevaCategoriaDiv.classList.add('categoria');
      nuevaCategoriaDiv.textContent = nuevaCategoria;
  
      // Agregar la nueva categoría al contenedor
      categoriasContainer.appendChild(nuevaCategoriaDiv);
    } else {
      alert('Debe ingresar un nombre válido para la categoría.');
    }
  }