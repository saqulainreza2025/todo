import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const todosCollection = collection(db, 'todos');

export const addTodo = async (text: string) => {
  try {
    await addDoc(todosCollection, {
      text,
      completed: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error adding todo:', error);
    throw error;
  }
};

export const getTodos = async () => {
  try {
    const querySnapshot = await getDocs(todosCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting todos:', error);
    throw error;
  }
};

export const deleteTodo = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'todos', id));
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

export const updateTodoStatus = async (id: string, completed: boolean) => {
  try {
    await updateDoc(doc(db, 'todos', id), {
      completed
    });
  } catch (error) {
    console.error('Error updating todo status:', error);
    throw error;
  }
};

export const updateTodoText = async (id: string, text: string) => {
  try {
    await updateDoc(doc(db, 'todos', id), {
      text
    });
  } catch (error) {
    console.error('Error updating todo text:', error);
    throw error;
  }
}; 