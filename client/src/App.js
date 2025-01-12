import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./Register";
import Login from "./Login";
import AdminPanel from "./Admin";
import DWSApi from "./adminapp"
import { getAccountData } from './utils/api'; // Подключение правильного импорта
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
import exitAccount from './exitAccount.jpg'

// Основной компонент приложения
function App() {
  const { role, isAuthenticated, userName } = useAuth();

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />  {/* Хедер теперь использует данные из контекста */}
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={isAuthenticated && role === "1" ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/services" element={<Services />} />
            <Route path="/api" element={isAuthenticated && role === "2" ? <DWSApi /> : <Navigate to="/" />} />
            <Route path="/apps" element={isAuthenticated && role === "2" ? <Apps /> : <Navigate to="/" />} />
            <Route path="/instruction" element={isAuthenticated && role === "2" ? <Instruction /> : <Navigate to="/" />} />
            <Route path="/account" element={<Account />} />
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
        {isAuthenticated && role === "1" ? (
          <h3>Роскомнадзор</h3>
        ) : (
          <h3>Энергасбыт</h3>
        )}
        {isAuthenticated && role === "1" ? (
          <img src={RKN} style={{width: "40px"}} alt="Описание" />
        ) : (
          <img src={myImage} style={{width: "60px"}} alt="Описание" />
        )}
      </div>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/services">Сервисы</Link>
        {isAuthenticated && role === "2" && <Link to="/instruction">Инструкция</Link>}
        <Link to="/account">Мой Аккаунт</Link>
        {isAuthenticated && role === "2" && <Link to="/apps">Панель Пользователя</Link>}
        {isAuthenticated && role === "1" && <Link to="/admin">Админ Панель</Link>}  {/* Панель администратора */}
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
  const instruction = [
    { title: "Как правильно входить", 
      description: "В поле Login вводите почту holodka*@gmail.com. Вместо * вводите цыфру которую вам дали за вашим номером как на примере 2-го фото, вместо '45' должен быть ваш номер, в поле Password - вводите пароль который вам дали или который вы поменяли на свой!",
      image1: login1,
      image2: login2 
    },
    { title: "Что делать если выдаёт ошибку Аккаунта", 
      description: "У вас сверху есть Красная кнопка 'Выйти', нажимаете на неё, выходите и заного входите после этого должно быть всё нормально, если выдаёт ошибку или что-то другое пишете в ТГ группу!",
      image1: exitAccount,
    },
    { title: "Как правильно делать передачи", 
      description: "У вас есть ваша Панель Пользователя. Нажимаете на 'Информация о клиенте' заполняете, НОМЕР ОБЕЗАТЕЛЬНО ВВОДИТЕ БЕЗ +, нажимаете отправить, если у вас вылазить окошко с текстом который ниже показан, всё нормально работаете дальше, если выдаёт ошибку или что-то другое пишете в ТГ группу!",
      image1: infoForm,
      image2: formgood 
    },
  ];
  return (
    <div className="services">
      <h2>Инструкции!</h2>
      <div className="service-cards">
        {instruction.map((instructio, index) => (
          <div key={index} className="card">
            <h3>{instructio.title}</h3>
            <img src={instructio.image1} alt={instructio.title} className="card-image" />
            <h5>{instructio.description}</h5>
            {instructio.image2 && (
            <img src={instructio.image2} alt={instructio.title} className="card-image" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Account() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmissionDate, setLastSubmissionDate] = useState("—");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Получаем статус аутентификации

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
      case 2:
        return "Холодка";
      case 1:
        return "Админ";
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
      <h2>Мой аккаунт</h2>
      <p>Имя: {account.name}</p>
      <p>Email: {account.email}</p>
      <p>Роль: {roleName}</p>
      <p>Отправок за сегодня: {submissionCount}</p>
      <p>Дата последней отправки: {lastSubmissionDate}</p>
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

      if (role !== "2") { // Если роль не "1", то доступ закрыт
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
      id: "modal1",
      title: "Была замена счетчика!",
      content: (
        <>
          Ответ: идет плановая замена счетчика по постановлению Министерства Энергетики номер 554 — это обязательная процедура к выполнению.
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
  ];
  // Массив для модальных окон "ПОСЛЕ МУСОРОВ ДЕБЕТ"
  const rightModalContent = [
    {
      id: "modal10",
      title: "Зачем я буду говорить вам документ",
      content: (
        <>
          Ответ:  По этому регистрационному номеру создаются договора на обслуживание, мастер забирает договора у инспектора и по ним получается счетчик на складе. По этому его нужно внести в систему.
        </>
      )
    },
    {
      id: "modal11",
      title: "Почему я должен называть документы по телефону!?",
      content: (
        <>
          Ответ: Регистрационный номер необходим для регистрации заявки которая направляется инспектору в энергосбыт. Инспектор заверяет официальный договор и направляет его мастеру. Тот в свою очередь приходит к Вам уже с готовым документом и только после того как вы ознакомитесь с договором он приступает к установке.
        </>
      )
    },
    {
      id: "modal12",
      title: "У вас есть мои данные я не могу вам ничего давать",
      content: (
        <>
          Ответ: Я вас ставлю в известность что ваша персональная информация касательно паспорта не требуется такая как: кем выдан паспорт, место вашего рождения, дата выдачи паспорта либо код вашего подразделения все что необходимо это исключительно данные для регистрации заявки на плановую замену то есть номер СНИЛС или серия и номер паспорта.
        </>
      )
    },
    {
      id: "modal13",
      title: "Как я могу удостовериться что вы с Энергосбыта",
      content: (
        <>
          Ответ: Вы можете найти старый договор, на 6 странице указано 10-ть контактных номеров телефона Энергосбыта, в том числе с которого я связываюсь
        </>
      )
    },
    {
      id: "modal14",
      title: "Я не буду называть персональные данные по телефону",
      content: (
        <>
          Ответ: Персональные данные Вы и не должны разглашать, на будущее уведомляю что персональными данными в документах являются ваше место прописки, адрес проживания, код подразделения и место выдачи. Остальную информацию: номер документа, вы предоставляете в больницах и других гос учереждениях. Так что нодобности переживать нет, Я вас слушаю!
        </>
      )
    },
    {
      id: "modal15",
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
    purchaseType: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();

    const { fio, phone, dataroz, region, document, message, purchaseType } = formData;

    if (!fio || !phone || !dataroz || !region || !message || !purchaseType || !document) {
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

    const data = {
      fio,
      phone,
      dataroz,
      region,
      document,
      message,
      purchaseType,
      accountName: account.name,
    };

    setLoading(true);

    fetch("https://script.google.com/macros/s/AKfycbxlleZ0MgyNzSkXdC9pf-xHEY42VoJ0KsfBnR-V4Oq24ukGSqqJ5qqAr6F38_S86Y-BhQ/exec", {
      method: "POST",
      body: new URLSearchParams(data),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => response.json())
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
          purchaseType: "",
        });
      })
      .catch((error) => {
        console.error("Ошибка при отправке:", error);
        alert("Произошла ошибка при отправке данных.");
      })
      .finally(() => {
        setLoading(false);
      });

    fetch("https://energo-onyx.onrender.com/submit-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    }).catch((error) => {
      console.error("Ошибка при логировании данных на сервере:", error);
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
                    <select
                      name="purchaseType"
                      value={formData.purchaseType}
                      onChange={handleChange}
                      required
                      style={{ padding: '10px', marginBottom: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
                    >
                      <option value="">Выберите тип телефонии</option>
                      <option value="Whatsapp">Whatsapp</option>
                      <option value="Microsip">Microsip</option>
                    </select>

                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        fontSize: '16px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                      }}
                    >
                      Отправить
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





export default App;
