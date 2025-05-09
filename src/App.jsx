
import { RouterController } from "./routes";
import { Provider } from "react-redux";
import  StoreRedux  from "./redux/store";

// const router=createHashRouter([
//   {
//     path:'/',
//     element:<Login/>
//   },
//   {
//     element:<AuthGuard/>
//   },
//   {
//     path:PublicRoutes.LOGIN,
//     element:<Login/>
//   },
//   {
//     path:'/Home',
//     element:<Dashboard view={<Content/>}/>
//   },
//   {
//     path:'/UserInfo',
//     element:<Dashboard view={<UserInfo/>}/>
//   },
//   {
//     path:'/CntrlUsuarios',
//     element:<Dashboard view={<CntrlUsuarios/>}/>
//   },
//   {
//     path:'*',
//     element:<p style={{color:'black'}}>NOT FOUND</p>
//   }

// ])

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <Provider store={StoreRedux}>
        <RouterController/>
      </Provider>
    </>
  );
}

export default App;
