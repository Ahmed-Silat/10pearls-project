import { FaFacebookF } from "react-icons/fa";
import Button from "../button/Button";
import GoogleIcon from "../GoogleIcon";

export default function SocialMediaButtons() {
  return (
    <div className="flex ">
      <Button
        name="Google"
        image={<GoogleIcon className="w-5 h-5 mr-2" />}
        className="flex items-center mr-2 my-2 py-2 px-8 border-2 border-red-500 rounded-lg w-1/2 text-red-500 font-semibold"
        imageClass="w-5 h-5 mr-2"
      />
      <Button
        name="Facebook"
        image={<FaFacebookF />}
        className="flex items-center my-2 py-2 px-8 border-2 border-blue-700 rounded-lg w-1/2 text-blue-700 font-semibold"
        imageClass="mr-2"
      />
    </div>
  );
}
