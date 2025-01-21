import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./Register";
import Login from "./Login";
import AdminPanel from "./Admin";
import AdminPanelminus from "./Adminminus";
import DWSApi from "./adminapp"
import { getAccountData, getAllUsers } from './utils/api'; // Подключение правильного импорта
import { AuthProvider, useAuth } from "./AuthContext"; // Подключаем контекст
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import axios from "axios";  // Добавить эту строку
import myImage from './onyx.png';
import api from './utils/api'; // Проверь путь к файлу api.js
import RKN from './RKN.svg';
import login1 from './login1.jpg'
import login2 from './login2.jpg'
import infoForm from './Info.jpg'
import formgood from './formgood.jpg'
import UploadLeads from "./UploadLeads";
import AssignLeads from "./AssignLead";
import MyLeads from "./MyLeads";
import exitAccount from './exitAccount.jpg'
import LeadsTable from "./LeadsTable";


// Основной компонент приложения
function App() {
  const { role, isAuthenticated, userName } = useAuth();
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers(); // Получаем пользователей
      const total = data.reduce((sum, user) => sum + user.count, 0); // Считаем общее количество отправок
      setTotalSubmissions(total); // Обновляем состояние с общим количеством отправок
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
    }
  };

  useEffect(() => {
    fetchUsers(); // Загружаем пользователей при монтировании компонента
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />  {/* Хедер теперь использует данные из контекста */}
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={isAuthenticated && role === "1" ? <AdminPanel setTotalSubmissions={setTotalSubmissions}/> : <Navigate to="/" />} />
            <Route path="/adminminus" element={isAuthenticated && role === "2" ? <AdminPanelminus /> : <Navigate to="/" />} />
            <Route path="/services" element={<Services />} />
            <Route path="/apps" element={isAuthenticated && role === "5" ? <Apps /> : <Navigate to="/" />} />
            <Route path="/instruction" element={<Instruction />} />
            <Route path="/account" element={<Account totalSubmissions={totalSubmissions}/>} />
            <Route path="/dopinfo" element={isAuthenticated && role === "5" ? <DopInfo /> : <Navigate to="/" />} />
            <Route path="/upload" element= {<UploadLeads />} />
            <Route path="/assign" element={<AssignLeads />} />
            <Route path="/my-leads" element={<MyLeads />} />
            <Route path="/leads" element={<LeadsTable />} />
          </Routes>
        </div>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

// Компонент Header
const Header = () => {

  const { role, isAuthenticated } = useAuth();  // Получаем данные из контекста
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getAccountData = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при запросе аккаунта:", error.response?.data || error.message);
      throw error;
    }
  };



  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);  // Логируем полученный токен

    if (!token) {
      return;  // Если нет токена, не продолжаем выполнение
    }

    // Функция для получения данных пользователя
    const fetchAccountData = async () => {
      try {
        const data = await getAccountData(token);
        console.log("Account data:", data);  // Логируем данные аккаунта
        setAccount(data);  // Устанавливаем данные аккаунта в состояние
      } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        setError("Ошибка при загрузке данных.");
      }
    };

    fetchAccountData();  // Вызов функции для получения данных
  }, [navigate]);  // useEffect зависит от navigate (редиректа)

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/");  // Перенаправляем на страницу входа
    window.location.reload(); // Перезагружаем страницу
  };

  return (
    <header className="header">
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
        }}>
        {isAuthenticated && (role === "1" || role === "3") ? (
          <h3>Роскомнадзор</h3>
        ) : (
          <h3>Энергасбыт</h3>
        )}
        {isAuthenticated && (role === "1" || role === "3") ? (
          <img src={RKN} style={{ width: "40px" }} alt="Описание" />
        ) : (
          <img src={myImage} style={{ width: "60px" }} alt="Описание" />
        )}
      </div>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/services">Сервисы</Link>
        <Link to="/instruction">Инструкция</Link>
        <Link to="/account">Мой Аккаунт</Link>
        {isAuthenticated && role === "5" && <Link to="/apps">Панель Пользователя</Link>}
        {isAuthenticated && role === "2" && <Link to="/adminminus">Проверка передач</Link>}  {/* Проверка передач */}
        {isAuthenticated && role === "1" && <Link to="/admin">Админ Панель</Link>}  {/* Панель администратора */}
        {isAuthenticated && role === "5" && <Link to="/dopinfo">Доп Информация</Link>}
        <button className="btn logout" style={{ color: "red" }} onClick={handleLogout}>Выйти</button>
      </nav>
    </header>
  );
};


// Защищённый маршрут для администраторов
const ProtectedRoute = ({ children, isAdmin }) => {
  return isAdmin ? children : <Navigate to="/" />;
};

// Главная страница
function Home() {
  const { role, isAuthenticated } = useAuth();  // Получаем данные из контекста

  return (
    <div className="home">
      {isAuthenticated && role === "1" ? (
        <h1>Привет в Роскомнадзоре</h1>
      ) : (
        <h1>Привет в Энергосбыте</h1>
      )}
      <p>Your trusted partner in energy management and sustainable solutions.</p>
      <Link to="/services" className="btn">Explore Our Services</Link>
    </div>
  );
}

// Страница с услугами
function Services() {
  const services = [
    { title: "Billing and Payments", description: "Manage and pay your bills effortlessly." },
    { title: "Energy Efficiency Solutions", description: "Optimize your energy consumption." },
    { title: "Sustainable Energy Options", description: "Switch to renewable energy sources." },
  ];
  return (
    <div className="services">
      <h2>Our Services</h2>
      <div className="service-cards">
        {services.map((service, index) => (
          <div key={index} className="card">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Instruction() {
  const { role, isAuthenticated } = useAuth();  // Получаем данные из контекста

  const instruction = [
    {
      title: "Как правильно входить",
      description: "В поле Login вводите почту mamita@gmail.com. В поле Password - вводите пароль который вам дали или который вы поменяли на свой!",
      image1: login1,
      image2: login2
    },
    {
      title: "Что делать если выдаёт ошибку Аккаунта",
      description: "У вас сверху есть Красная кнопка 'Выйти', нажимаете на неё, выходите и заного входите после этого должно быть всё нормально, если выдаёт ошибку или что-то другое пишете в ТГ группу!",
      image1: exitAccount,
    }
  ];

  const instructHol = [
    {
      title: "Как правильно входить",
      description: "В поле Login вводите почту holodka*@gmail.com. Вместо * вводите цыфру которую вам дали за вашим номером как на примере 2-го фото, вместо '45' должен быть ваш номер, в поле Password - вводите пароль который вам дали или который вы поменяли на свой!",
      image1: login1,
      image2: login2
    },
    {
      title: "Что делать если выдаёт ошибку Аккаунта",
      description: "У вас сверху есть Красная кнопка 'Выйти', нажимаете на неё, выходите и заного входите после этого должно быть всё нормально, если выдаёт ошибку или что-то другое пишете в ТГ группу!",
      image1: exitAccount,
    },
    {
      title: "Как правильно делать передачи",
      description: "У вас есть ваша Панель Пользователя. Нажимаете на 'Информация о клиенте' заполняете, НОМЕР ОБЕЗАТЕЛЬНО ВВОДИТЕ БЕЗ +, нажимаете отправить, если у вас вылазить окошко с текстом который ниже показан, всё нормально работаете дальше, если выдаёт ошибку или что-то другое пишете в ТГ группу!",
      image1: infoForm,
      image2: formgood
    },
  ];

  return (
    <div className="services">
      <h2>Инструкции!</h2>
      <div className="service-cards">

        {isAuthenticated && (role === "5" || role === "1" || role === "2" || role === "3" || role === "4") ? (
            instructHol.map((instructio, index) => (
              <div key={index} className="card">
                <h3>{instructio.title}</h3>
                <img src={instructio.image1} alt={instructio.title} className="card-image" />
                <h5>{instructio.description}</h5>
                {instructio.image2 && (
                  <img src={instructio.image2} alt={instructio.title} className="card-image" />
                )}
              </div>
            ))
        ) : (
            instruction.map((instructio, index) => (
              <div key={index} className="card">
                <h3>{instructio.title}</h3>
                <img src={instructio.image1} alt={instructio.title} className="card-image" />
                <h5>{instructio.description}</h5>
              </div>
            ))
        )}

      </div>
    </div>
  );
}

function Account() {
  const [account, setAccount] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [error, setError] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmissionDate, setLastSubmissionDate] = useState("—");
  const navigate = useNavigate();
  const {role, isAuthenticated } = useAuth(); // Получаем статус аутентификации

      const fetchUsers = async () => {
          const token = localStorage.getItem("token");
          if (!token) {
              setError("Токен не найден");
              navigate("/login");
              return;
          }
  
          // Проверка роли
          if (role !== "5") {
              setError("У вас нет прав для доступа к этой странице.");
              navigate("/");
              return;
          }
  
          try {
              const data = await getAllUsers();
  
              // Считаем сумму всех отправок и обновляем пользователей
              const total = data.reduce((sum, user) => sum + user.count, 0);
              setUsers(data);
              setTotalSubmissions(total);
          } catch (error) {
              setError("Ошибка подключения к серверу.");
              console.error("Ошибка при загрузке пользователей:", error);
          }
      };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const fetchAccountData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setAccount(data);

        // Обновление данных счётчика
        const userId = data.id || "defaultUserId";
        updateSubmissionData(userId);
      } catch (err) {
        console.error("Ошибка при получении данных аккаунта:", err);
        setError("Ошибка при загрузке данных.");
      }
    };

    fetchAccountData();
  }, []);

  // Логика сброса счётчика и обновления состояния
  const updateSubmissionData = (userId) => {
    const submissionCountKey = `${userId}_submissionCount`;
    const submissionDateKey = `${userId}_submissionDate`;
    const currentDate = new Date().toISOString().split("T")[0];
    const storedDate = localStorage.getItem(submissionDateKey) || "";

    if (storedDate !== currentDate) {
      localStorage.setItem(submissionDateKey, currentDate);
      localStorage.setItem(submissionCountKey, "0");
    }

    const updatedSubmissionCount = parseInt(localStorage.getItem(submissionCountKey), 10) || 0;
    setSubmissionCount(updatedSubmissionCount);
    setLastSubmissionDate(currentDate);
  };

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/");
    window.location.reload();
  };

  const getRoleName = (isAdmin) => {
    switch (isAdmin) {
      case 5:
        return "Холодка";
      case 1:
        return "Админ";
        case 2:
          return "Модератор";
      case 3:
        return "Госы";
      default:
        return "Пользователь";
    }
  };

  // Рендеринг
  if (!isAuthenticated) {
    return (
      <div className="account">
        <h2>Для доступа к аккаунту, пожалуйста, войдите или зарегистрируйтесь.</h2>
        <button className="btn" onClick={() => navigate("/login")}>Войти</button>
        <button className="btn" onClick={() => navigate("/register")}>Зарегистрироваться</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account">
        <p>{error}</p>
        <button className="btn logout" style={{ color: "red" }} onClick={handleLogout}>Выйти</button>
      </div>
    );
  }

  if (!account) {
    return <div className="account"><p>Загрузка...</p></div>;
  }

  const roleName = getRoleName(account.isAdmin);

  return (
    <div className="account">
      <p>Общее количество отправок: <strong>{totalSubmissions}</strong> из <strong>80</strong></p>
      <h2>Мой аккаунт</h2>
      <p>Имя: {account.name}</p>
      <p>Email: {account.email}</p>
      <p>Роль: {roleName}</p>
      <p>Отправок за сегодня: {account.count}</p>
      <p>Дата последней отправки: {account.data}</p>
      <button className="btn logout" onClick={handleLogout}>Выйти</button>
    </div>
  );
}




// Компонент Footer
function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2024 EnergoSales. All rights reserved.</p>
      <nav>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </nav>
      <p>by from Kolomoisky</p>
    </footer>
  );
}

// Общий компонент для модальных окон
const Modal = ({ id, title, content }) => {
  return (
    <div
      className="modal fade bd-example-modal-lg"
      id={id}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="myLargeModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ backgroundColor: '#F0FFFF', }}>
          <div className="modal-header" style={{ backgroundColor: '#F0FFFF', }}>
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body" style={{ backgroundColor: '#F0FFFF', }}>
            <h5>{content}</h5>
          </div>
          <div className="modal-footer" style={{ backgroundColor: '#F0FFFF', }}>
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Главный компонент
function Apps() {

  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { role, isAuthenticated, name } = useAuth();  // Получаем роль и имя пользователя

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Токен не найден");
        navigate("/login");
        return;
      }

      if (role !== "5") { // Если роль не "2", то доступ закрыт
        setError("У вас нет прав для доступа к этой странице.");
        navigate("/");
        return;
      }
    };

    if (isAuthenticated) { // Проверяем, авторизован ли пользователь
      fetchUsers();
    } else {
      setError("Пожалуйста, войдите в систему.");
      navigate("/login");
    }
  }, [role, isAuthenticated, navigate]);

  // Массив для модальных окон "ДАНЯ"
  const leftModalContent = [
    {
      id: "modal0",
      title: "Почему звоните через Whatsapp?",
      content: (
        <>
          Я вас набираю через специальное приложение и как именно вас набирает уже решает приложение.
        </>
      )
    },
    {
      id: "modal1",
      title: "Была замена счетчика!",
      content: (
        <>
          Ответ: идет плановая замена счетчика по постановлению Министерства Энергетики Приказом ПАО "Россети" от 21.02.2024 № 77 утвержден стандарт организации "Приборы учета электроэнергии. Стандарт вводится в действие 01.07.2025.
          <br />
          <br />
          Второй ответ: Счетчик будет вам установлен МЕРКУРИЙ 230 с автоматической передачей данных в Энергосбыт.
        </>
      )
    },
    {
      id: "modal2",
      title: "Я сейчас позвоню родным!",
      content: (
        <>
          Ответ: В таких ситуациях нужно человека записывать как минимум через 5-6 дней чтоб она если что с родными попиздела на счет этого… Регистрация выполняется по вашим данным и и акт подключения счетчика будете подписывать именно вы потому что замена производится  именно вам поэтому я с вами связался
        </>
      )
    },
    {
      id: "modal3",
      title: "Я занята, не дома и тд…",
      content: (
        <>
          Ответ: Уделите мне буквально 3 минуты времени
          <br />
          либо
          <br />
          Ответ: Давайте я вам тогда перезвоню когда вы будете свободны примерно 20-30 минут ожидайте моего звонка
        </>
      )
    },
    {
      id: "modal4",
      title: "У меня нет возможности записать, может запомню?",
      content: (
        <>
          Ответ: Вряд ли вы запомните, вам нужно записать контактные данные мастера и номер счётчика, который вы сверите в документах. Если у вас нет под рукой листа с ручкой можете записать в телефоне. Постарайтесь найти, я ожидаю Вас.
        </>
      )
    },
    {
      id: "modal5",
      title: "Мне никто не говорил",
      content: (
        <>
          Ответ:  Настоящим дзвонком уведомляем Вас о плановой замене счётчиков. Это государственная программа установлена на замену западного оборудования на отечественное.
        </>
      )
    },
    {
      id: "modal6",
      title: "Я по телефону ничего не буду решать!",
      content: (
        <>
          Ответ:  Этот вопрос в любом случае по телефону не решается, мы регистрируем заявку за вами на установку счётчика, решать вы будете уже на месте с мастером при подписании договора.
        </>
      )
    },
    {
      id: "modal7",
      title: "Я сам(а) пойду в Энергосбыт!",
      content: (
        <>
          Ответ:  Так подошла ваша очередь вас настоящим дзвонком уведомляют что необходимо произвести запись на плановую замену. Вся процедура за счет государства, если хотите отдать завяку кому-то другому это Ваше право, тогда менять счетчик в дальнейшем будете за свой счет, в том числе оплачивать услуги мастера.
        </>
      )
    },
    {
      id: "modal8",
      title: "Запишусь САМ(А)",
      content: (
        <>
          Ответ:  Тогда вам нужно точно также звонить в контакт центр предварительно на посещение мастера, будете потом опять ждать своей очереди, и к сожалению делать это за свой счет оплачивать услуги мастера, замену счетчика, напоминаю вам что эта государственная программа производится в обязательном порядке, в любом случае нужно будет ставить новый счётчик.
        </>
      )
    },
    {
      id: "modal9",
      title: "Зачем я буду говорить вам документ",
      content: (
        <>
          Ответ:  По этому регистрационному номеру создаются договора на обслуживание, мастер забирает договора у инспектора и по ним получается счетчик на складе. По этому его нужно внести в систему.
        </>
      )
    },
    {
      id: "modal10",
      title: "У меня стоит умный счетчик который передает данные сам,мне его уже меняли",
      content: (
        <>
          Ответ:  Система ваш номер выдала это означает что данные к нам передаются не корректно в таком случае давайте подберем дату и время чтобы мастер приехал и провел диагностику вашего счетчика,это бесплатно
        </>
      )
    },
    {
      id: "modal11",
      title: "Я сам схожу  в Энергосбыт сам куплю счетчик!!!",
      content: (
        <>


          Ответ:  Вам нужно самостоятельно будет покупать счетчик который марки Меркурий 230 БМ-01 по сколько это соотечественный производитель и не подлежит санкциям заказывать с интернета либо искать в соответсвующих магазинах именно этот который не подвергается санкциям, в данный момент его не присутствует в наличии магазинах , только на складах Энергосбыта поскольку была оптовая закупка, исходя из постановления 554, меняют не только вам а всем на территории России, данная процедура в обязательном порядке. Не важно сами вы это будете делать либо же за счет государства но Если вы не успеете заменить до определенного времени к сожалению вас могут отключить от энергоснабжения  потом так как отказываетесь в данный момент на безоплатное подключение за счет государства вам приодеться  искать мастера назначать день время самостоятельно, тратить своё время оплачивать замену и установку счетчика к этому всему нужно найти где-то именно этот счетчик и приобрести его так же за свой счет.
          <br />
          (Я смотрел его нету в Интернете)
          <br />
          Ответ: Конечно, была оптовая закупка исходя из постановления, из-за этого их сейчас в магазинах нет в наличии.
        </>
      )
    },
  ];
  // Массив для модальных окон "ПОСЛЕ МУСОРОВ ДЕБЕТ"
  const rightModalContent = [
    {
      id: "modal15",
      title: "Зачем я буду говорить вам документ",
      content: (
        <>
          Ответ:  По этому регистрационному номеру создаются договора на обслуживание, мастер забирает договора у инспектора и по ним получается счетчик на складе. По этому его нужно внести в систему.
        </>
      )
    },
    {
      id: "modal16",
      title: "Почему я должен называть документы по телефону!?",
      content: (
        <>
          Ответ: Регистрационный номер необходим для регистрации заявки которая направляется инспектору в энергосбыт. Инспектор заверяет официальный договор и направляет его мастеру. Тот в свою очередь приходит к Вам уже с готовым документом и только после того как вы ознакомитесь с договором он приступает к установке.
        </>
      )
    },
    {
      id: "modal17",
      title: "У вас есть мои данные я не могу вам ничего давать",
      content: (
        <>
          Ответ: Я вас ставлю в известность что ваша персональная информация касательно паспорта не требуется такая как: кем выдан паспорт, место вашего рождения, дата выдачи паспорта либо код вашего подразделения все что необходимо это исключительно данные для регистрации заявки на плановую замену то есть номер СНИЛС или серия и номер паспорта.
        </>
      )
    },
    {
      id: "modal18",
      title: "Как я могу удостовериться что вы с Энергосбыта",
      content: (
        <>
          Ответ: Вы можете найти старый договор, на 6 странице указано 10-ть контактных номеров телефона Энергосбыта, в том числе с которого я связываюсь
        </>
      )
    },
    {
      id: "modal19",
      title: "Я не буду называть персональные данные по телефону",
      content: (
        <>
          Ответ: Персональные данные Вы и не должны разглашать, на будущее уведомляю что персональными данными в документах являются ваше место прописки, адрес проживания, код подразделения и место выдачи. Остальную информацию: номер документа, вы предоставляете в больницах и других гос учереждениях. Так что нодобности переживать нет, Я вас слушаю!
        </>
      )
    },
    {
      id: "modal20",
      title: "По какому Адресу Звоните/Будете менять Счётчик?",
      content: (
        <>
          Ответ: Плановая замена счётчика производиться по месту вашей прописки
          <br></br>
          (Если бадается и спрашивает какой у меня адрес)
          <br></br>
          Я простой оператор у меня такой информации нет, моя задача позвонить поставить запись и уже в дальнейшем мастер по вашему адресу приедет мастер на заявку.
        </>
      )
    },
  ];

  const { userName } = useAuth(); // Получаем userName из контекста

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false); // Для индикатора загрузки

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);

    if (!token) {
      return;
    }

    const fetchAccountData = async () => {
      try {
        const data = await getAccountData(token);
        console.log("Account data:", data);
        setAccount(data);
      } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        setError("Ошибка при загрузке данных.");
      }
    };

    fetchAccountData();
  }, []); // Поскольку navigate не используется, зависимость можно удалить

  const [formData, setFormData] = useState({
    name: "",
    fio: "",
    phone: "",
    message: "",
    dataroz: "",
    region: "",
    document: "",
    nameBaza: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isDisabled, setIsDisabled] = useState(false)

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const { fio, phone, dataroz, region, document, message, nameBaza } = formData;
  
    if (!fio || !phone || !dataroz || !region || !message || !nameBaza || !document) {
      alert("Пожалуйста, заполните все обязательные поля.");
      return;
    }
  
    if (!account || !account.name) {
      alert("Ошибка: Данные пользователя не загружены.");
      return;
    }
  
    // Уникальный ID пользователя (например, account.id или другой уникальный идентификатор)
    const userId = account.id || "defaultUserId";  // Замените на ваш уникальный идентификатор
    const submissionCountKey = `${userId}_submissionCount`;
    const submissionDateKey = `${userId}_submissionDate`;
  
    // Работа со счётчиком
    const currentDate = new Date().toISOString().split("T")[0]; // Только дата (YYYY-MM-DD)
    const storedDate = localStorage.getItem(submissionDateKey) || ""; // Дата последней отправки
    let submissionCount = parseInt(localStorage.getItem(submissionCountKey), 10) || 0; // Счётчик отправок
  
    // Сброс счётчика, если день изменился
    if (storedDate !== currentDate) {
      localStorage.setItem(submissionDateKey, currentDate); // Обновляем дату
      submissionCount = 1; // Сбрасываем счётчик на 1
      localStorage.setItem(submissionCountKey, submissionCount.toString());
    } else {
      // Увеличиваем счётчик, если дата не изменилась
      submissionCount += 1;
      localStorage.setItem(submissionCountKey, submissionCount.toString());
    }
  
    console.log(`Счётчик отправок: ${submissionCount}, Дата: ${currentDate}`);

    setIsDisabled(true);
    setLoading(true);
  
    const data = {
      fio,
      phone,
      dataroz,
      region,
      document,
      message,
      nameBaza,
      accountName: account.name,
    };
  
    setLoading(true);
  
    // Сначала отправляем данные в БД
    fetch("https://dws-energy.onrender.com/submit-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при логировании данных на сервере");
        }
        return response.json();
      })
      .then(() => {
        // После успешной отправки в БД, отправляем в Google Script
        return fetch("https://script.google.com/macros/s/AKfycbyh9ohN0yvmxJchuM1Y9mI0zGjhLLTTtIm1eR2RnbUMC6wNT3fOPt2WSdNdH8wCK8AFhA/exec", {
          method: "POST",
          body: new URLSearchParams(data),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      })
      .then(() => {
        alert(`Спасибо! Ваша информация успешно отправлена. Отправок за сегодня: ${submissionCount}`);
        // Очищаем форму только после успешной отправки
        setFormData({
          fio: "",
          phone: "",
          message: "",
          dataroz: "",
          region: "",
          document: "",
          nameBaza: "",
        });
      })
      .catch((error) => {
        console.error("Ошибка при отправке:", error);
        alert("Произошла ошибка при отправке данных.");
      })
      .finally(() => {
        setLoading(false);
        setIsDisabled(false);
        setLoading(false);
      });
  };  

  return (
    <main>
      <section className="py-5 text-center" style={{ backgroundColor: '#F0FFFF', }}>
        <div className="row">
          {/* Левая часть (4 колонки) с модальными окнами "ДАНЯ" */}
          <div className="col-4">
            <h3 style={{ color: 'red' }}>Заборы Счётчики</h3>
            <br></br>
            {/* Кнопки и модальные окна для левой части */}
            {leftModalContent.map((modal) => (
              <div key={modal.id}>
                <button
                  type="button"
                  className="w-75 btn btn-lg btn-primary mb-2"
                  data-bs-toggle="modal"
                  data-bs-target={`#${modal.id}`}
                >
                  {modal.title}
                </button>
                <Modal
                  id={modal.id}
                  title={modal.title}
                  content={modal.content}
                />
              </div>
            ))}
          </div>

          {/* Центральная часть с формой */}
          <div className="col-4">
            <div className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-lg btn-warning mb-2"
                data-bs-toggle="modal"
                data-bs-target="#info"
              >
                Информация о клиенте (нужно заполнять)
              </button>

              {/* Модальное окно с формой */}
              <Modal
                id="info"
                title="Информация о клиенте"
                content={
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#F0FFFF', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', maxWidth: '400px', margin: '0 auto' }}>
                    <input
                      type="text"
                      name="fio"
                      value={formData.fio}
                      onChange={handleChange}
                      placeholder="Его ФИО"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Телефон Клиента"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    <input
                      type="text"
                      name="dataroz"
                      value={formData.dataroz}
                      onChange={handleChange}
                      placeholder="Дата Рождения"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      placeholder="Регион"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    <input
                      type="text"
                      name="document"
                      value={formData.document}
                      onChange={handleChange}
                      placeholder="Документ Клиента"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Коментарии"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px', height: '100px' }}
                    />
                    <input
                      type="text"
                      name="nameBaza"
                      value={formData.nameBaza}
                      onChange={handleChange}
                      placeholder="Имя Базы"
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />

                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: isDisabled ? '#cccccc' : '#007bff',
                        color: '#fff',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                      disabled={isDisabled}
                    >
                      {isDisabled ? "ПОДОЖДИ НЕ ДРОЧИ ТЫ ЭТУ КНОПКУ" : "Отправить"}
                    </button>

                  </form>
                }
              />
            </div>

            {/* Форма для ввода текста */}
            <div className="d-flex justify-content-center mb-3">
              <textarea
                className="col-12"
                id="comment2"
                name="comment"
                cols="100"
                rows="5"
                style={{ fontSize: "18px", backgroundColor: 'white', }}
              />
            </div>
            <div className="d-flex justify-content-center">
            </div>
            {/* Прокрутка и текст справа */}
            <div
              className="prokrutka"
              role="document"
            >
              <h3 className="fw-bold mb-0" style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}></h3>
              <br />
              <h5 style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6', color: '#333' }}>
                <p>ИО: Добрый день/вечер! С вами связывается Энергасбыт. Меня зовут Евгений Алексеевич.</p>

                <p>Звоню вам уточнить информацию о замене вашего счётчика электроэнергии.</p>

                <p>Подошла ваша очередь на плановую бесплатную замену счётчика, необходимо подобрать дату и время, когда приедет мастер на замену.</p>

                <p>- У ВАС СЕЙЧАС ЕСТЬ ВОЗМОЖНОСТЬ ВЗЯТЬ ЛИСТОЧЕК И РУЧКУ?</p>

                <p>ДА А ЗАЧЕМ?</p>

                <p>- ВАМ НУЖНО БУДЕТ ЗАПИСАТЬ ДАТУ И ВРЕМЯ, КОГДА К ВАМ ПОДЬЕДЕТ МАСТЕР И ПОМЕНЯЕТ ВАМ СЧЁТЧИК.</p>

                <p>(ПОДБИРАЕМ ДАТУ И ВРЕМЯ, КОГДА СПЕЦИАЛИСТ СМОЖЕТ ПРИЕХАТЬ К КЛИЕНТУ)</p>
                <p style={{ color: 'red' }}>(НЕ РАНЬШЕ ЧЕМ ЧЕРЕЗ 3 ДНЯ)</p>

                <p>- ТАКЖЕ ЗАПИШИТЕ ИМЯ МАСТЕРА (ПЕТРОВ СЕМЁН НИКОЛАЕВИЧ) И НОМЕР НОВОГО СЧЁТЧИКА 00-24-32-654.</p>

                <p>- ЗАПИСАЛИ?</p>

                <p>ДА ЗАПИСАЛ.</p>

                <p>- МАСТЕР, КОГДА ПРИЕДЕТ МЕНЯТЬ ВАМ СЧЁТЧИК, ВАМ ТАКЖЕ НУЖНО БУДЕТ ПОДПИСАТЬ НОВЫЙ ДОГОВОР НА ОБСЛУЖИВАНИЕ С ЭНЕРГАСБЫТОМ.</p>

                <p>- ДОГОВОР БУДЕТ В ДВУХ ЭКЗЕМПЛЯРАХ. ОДИН ОСТАЁТЬСЯ У ВАС, ОДИН У МАСТЕРА. ОН ЕГО ПЕРЕДАСТ ИНСПЕКТОРУ В ЭНЕРГАСБЫТ. Всё что от вас будет необходимо предоставить в момент получения договора и установки счётчика — это поставить свою подпись на двух экземплярах договора!</p>

                <p>- СЕЙЧАС ДЛЯ ЗАЯВКИ на передачу счётчика за счёт государства вам в эксплуатацию требуется заполнить заявку на бесплатное подключение в системе Энергасбыта, по одному из документов: СНИЛС или ПАСПОРТ.</p>

                <p>По какому регистрационному номеру вам будет удобно?</p>

                <p>Без данной информации, к сожалению, я вас зарегистрировать не смогу!</p>

                <p>Для завершения записи, необходимо указать документ, по которому будет составлен договор на счётчик! Инспектор подготовит договор, и мастер вам его вручит! Это может быть СНИЛС или паспорт.</p>

                <p>Я вас ставлю в известность, что ваша персональная информация касательно паспорта не требуется, такая как: кем выдан паспорт, место вашего рождения, дата выдачи паспорта либо код вашего подразделения. Всё что необходимо — это исключительно серия и номер, то есть 4 и 6 цифры, не более. Если готовы, строго по 2 цифры, называйте слева направо, постарайтесь членораздельно, я вас слушаю!</p>

                <p>- ВСЕ ЗАЯВКА УСПЕШНО ЗАРЕГИСТРИРОВАНА. Ожидайте мастера.</p>

                <p>СВЕРЯЕМ ФИО, ДАТУ РОЖДЕНИЯ.</p>
              </h5>
            </div>

          </div>

          {/* Правая часть (4 колонки) с модальными окнами "ПОСЛЕ МУСОРОВ ДЕБЕТ" */}
          <div className="col-4">
            <h3 style={{ color: 'red' }}>Заборы Документы</h3>
            <br></br>
            {/* Кнопки и модальные окна для правой части */}
            {rightModalContent.map((modal) => (
              <div key={modal.id}>
                <button
                  type="button"
                  className="w-75 btn btn-lg btn-primary mb-2"
                  data-bs-toggle="modal"
                  data-bs-target={`#${modal.id}`}
                  style={{ backgroundColor: "red", borderColor: "red", width: '50px' }}
                >
                  {modal.title}
                </button>
                <Modal
                  id={modal.id}
                  title={modal.title}
                  content={modal.content}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// Страница с услугами
function DopInfo() {
  const services = [
    { title: "Адреса Энергосбыта", description: (
      <>
        1. Москва
        <br></br>
        2. СБП
        <br></br>
        3. Белгород
      </>
    )},
    { title: "Адреса Энергосбыта", description: (
      <>
        1. Москва
        <br></br>
        2. СБП
        <br></br>
        3. Белгород
      </>
    )},
  ];
  return (
    <div className="services">
      <h2>Доп Информация</h2>
      <div className="service-cards">
        {services.map((service, index) => (
          <div key={index} className="card">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}



export default App;