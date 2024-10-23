import { useEffect, useState } from "react";
import LabelWithInput from "../label-and-inputs/LabelWithInput";
import Button from "../button/Button";
import {
  deleteData,
  getData,
  postData,
  updateExistingTodo,
} from "../service/TodoService";
import { useNavigate } from "react-router-dom";
import CheckboxWithInput from "../checkbox-and-input/CheckboxWithInput";

export default function Dashboard() {
  const [todo, setTodo] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [toggleButton, setToggleButton] = useState(false);
  const [id, setId] = useState();
  const [markCompleted, setMarkCompleted] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    // setInputValue(event.target.value);
  };

  // const userDetails = localStorage.getItem("userData");
  // const currentUser = JSON.parse(userDetails);

  const fetchData = async () => {
    // console.log(userId);
    // const data = (await getData(currentUser.id)) || [];
    // setTodo(data);
  };

  const addTodo = async () => {
    // await postData(inputValue, currentUser.id);
    // await fetchData();
    // setInputValue("");
  };

  const editTodo = async (id, text) => {
    // setInputValue(text);
    // setId(id);
    // setToggleButton(true);
  };

  const updateTodo = async () => {
    // await updateExistingTodo(id, inputValue, currentUser.id);
    // await fetchData();
    // setToggleButton(false);
    // setInputValue("");
  };

  const deleteTodo = async (id) => {
    // await deleteData(id);
    // await fetchData();
  };

  const logout = () => {
    // localStorage.removeItem("userData");
    // navigate("/login");
  };

  const toggleMarkAsCompleted = (value) => {
    // setMarkCompleted(value);
  };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <div>
      <div className="flex justify-end mr-6 mt-1">
        <Button
          name="Incomplete Todo"
          className="bg-red-200 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-red-500 rounded-2xl font-semibold text-sm"
          // onClick={}
        />

        <Button
          name="Completed Todo"
          className="bg-red-200 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-red-500 rounded-2xl font-semibold text-sm"
          // onClick={}
        />

        <Button
          name="LOGOUT"
          className="bg-red-200 ml-2 my-3 px-5 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-red-500 rounded-2xl font-semibold text-sm"
          onClick={logout}
        />
      </div>

      <div className="flex justify-center items-center h-screen font-sans">
        <div className="bg-white-800 p-32 rounded-lg shadow-lg text-black text-lg">
          <form>
            <div className="flex items-end">
              <LabelWithInput
                htmlFor="addTodo"
                // labelClass="font-extrabold"
                labelName="ADD TODO"
                inputType="text"
                inputId="addTodo"
                placeholder="Enter Your Todo"
                onChange={handleInputChange}
                value={inputValue}
              />
              <Button
                name={toggleButton ? "UPDATE" : "ADD"}
                className="bg-lime-600 ml-2 my-3 px-6 py-2 flex justify-center items-center transition duration-500 ease-in-out hover:bg-lime-700 rounded-lg font-semibold"
                textClass="ml-0"
                onClick={() => {
                  toggleButton ? updateTodo() : addTodo();
                }}
              />
            </div>
          </form>

          <ul>
            {todo.map((item) => {
              return (
                <li key={item.id} className="flex items-center">
                  {item.title}
                  <CheckboxWithInput labelName="Mark Completed" />
                  <Button
                    name="EDIT"
                    className="bg-blue-400 ml-2 my-3 px-3 py-1 flex justify-center items-center transition duration-500 ease-in-out hover:bg-blue-500 rounded-lg font-semibold text-sm"
                    onClick={() => {
                      editTodo(item.id, item.title);
                    }}
                  />
                  <Button
                    name="DELETE"
                    className="bg-red-500 ml-2 my-3 px-3 py-1 flex justify-center items-center transition duration-500 ease-in-out hover:bg-red-700 rounded-lg font-semibold text-sm"
                    onClick={() => {
                      deleteTodo(item.id);
                    }}
                  />{" "}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
