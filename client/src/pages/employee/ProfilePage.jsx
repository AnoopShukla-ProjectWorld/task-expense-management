import Input from "../../components/common/Input";

import Button from "../../components/common/Button";

function ProfilePage() {
  return (
    <div
      className="
        max-w-3xl bg-white
        p-8 rounded-2xl
        shadow-sm
      "
    >
      <h1 className="text-3xl font-bold mb-8">
        My Profile
      </h1>

      <div className="space-y-5">
        <Input label="Full Name" />

        <Input label="Email" />

        <Input label="Phone" />

        <Button>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default ProfilePage;