import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.models.addresses import AddressModel
from src.models.contractors import ContractorModel
from src.models.curators import CuratorModel
from src.models.systems import SystemsModel
from src.models.systems_on_address import SystemOnAddressModel
from src.models.types_of_works import TypesOfWorksModel
from src.models.users import UserModel
from src.models.works import WorksModel
from src.schemas.works import WorkCreate
from src.services.ContractorAddressService import ContractorAddressService
from src.services.SystemsService import SystemsService
from src.services.WorksService import WorksService


class FakeResult:
    def __init__(self, item=None, items=None):
        self.item = item
        self.items = items or []

    def scalar_one_or_none(self):
        return self.item

    def scalar_one(self):
        return self.item

    def scalars(self):
        return self

    def all(self):
        return self.items


class FakeSession:
    def __init__(self, execute_results=None, get_results=None):
        self.execute_results = list(execute_results or [])
        self.get_results = dict(get_results or {})
        self.added = []
        self.deleted = []
        self.commits = 0

    async def execute(self, stmt):
        if not self.execute_results:
            raise AssertionError("Unexpected execute call")
        return self.execute_results.pop(0)

    async def get(self, model, ident):
        return self.get_results.get((model, ident))

    def add(self, obj):
        self.added.append(obj)

    async def delete(self, obj):
        self.deleted.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj, attribute_names=None):
        return None


def admin_user():
    return UserModel(
        id=1,
        username="admin",
        password_hash="hash",
        role="admin",
        email="admin@example.com",
        phone="+100000000",
        is_active=True,
    )


def curator_user():
    return UserModel(
        id=2,
        username="curator",
        password_hash="hash",
        role="curator",
        email="curator@example.com",
        phone="+200000000",
        is_active=True,
    )


class BackendServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_contractor_address_remove(self):
        contractor = ContractorModel(id=10, name_of_contractor="ACME", is_active=True)
        address = AddressModel(id=5, customer_id=1, address_name="HQ")
        contractor.addresses.append(address)
        session = FakeSession(
            execute_results=[FakeResult(item=contractor)],
            get_results={(AddressModel, 5): address},
        )
        service = ContractorAddressService(session)

        removed = await service.remove_address(10, 5, admin_user())

        self.assertTrue(removed)
        self.assertEqual(session.commits, 1)
        self.assertEqual(contractor.addresses, [])

    async def test_systems_add_to_address_creates_relation(self):
        address = AddressModel(id=5, customer_id=1, address_name="HQ")
        system = SystemsModel(id=7, name="HVAC")
        relation = SystemOnAddressModel(id=11, address_id=5, system_id=7)
        relation.system = system
        session = FakeSession(
            execute_results=[FakeResult(item=None), FakeResult(item=relation)],
            get_results={
                (AddressModel, 5): address,
                (SystemsModel, 7): system,
            },
        )
        service = SystemsService(session)

        created = await service.add_to_address(7, 5, admin_user())

        self.assertIsNotNone(created)
        self.assertEqual(created.id, 11)
        self.assertEqual(session.commits, 1)
        self.assertEqual(len(session.added), 1)

    async def test_systems_duplicate_relation_returns_none(self):
        address = AddressModel(id=5, customer_id=1, address_name="HQ")
        system = SystemsModel(id=7, name="HVAC")
        existing = SystemOnAddressModel(id=11, address_id=5, system_id=7)
        session = FakeSession(
            execute_results=[FakeResult(item=existing)],
            get_results={
                (AddressModel, 5): address,
                (SystemsModel, 7): system,
            },
        )
        service = SystemsService(session)

        created = await service.add_to_address(7, 5, admin_user())

        self.assertIsNone(created)
        self.assertEqual(session.commits, 0)
        self.assertEqual(session.added, [])

    async def test_works_create_returns_loaded_work(self):
        address = AddressModel(id=5, customer_id=1, address_name="HQ")
        work_type = TypesOfWorksModel(id=3, name="Repair")
        technician = admin_user()
        work = WorksModel(
            id=99,
            address_id=5,
            type_of_work_id=3,
            technician_id=1,
            description="Fix leak",
        )
        work.address = address
        work.type_of_work = work_type
        work.technician = technician
        session = FakeSession(
            execute_results=[FakeResult(item=work)],
            get_results={
                (AddressModel, 5): address,
                (TypesOfWorksModel, 3): work_type,
                (UserModel, 1): technician,
            },
        )
        service = WorksService(session)

        created = await service.create(
            WorkCreate(address_id=5, type_of_work_id=3, technician_id=1, description="Fix leak"),
            admin_user(),
        )

        self.assertEqual(created.id, 99)
        self.assertEqual(created.address.address_name, "HQ")
        self.assertEqual(session.commits, 1)

    async def test_works_create_requires_access(self):
        address = AddressModel(id=5, customer_id=1, address_name="HQ")
        work_type = TypesOfWorksModel(id=3, name="Repair")
        technician = curator_user()
        session = FakeSession(
            execute_results=[FakeResult(item=None)],
            get_results={
                (AddressModel, 5): address,
                (TypesOfWorksModel, 3): work_type,
                (UserModel, 2): technician,
            },
        )
        service = WorksService(session)

        with self.assertRaises(PermissionError):
            await service.create(
                WorkCreate(address_id=5, type_of_work_id=3, technician_id=2, description="Fix leak"),
                curator_user(),
            )


if __name__ == "__main__":
    unittest.main()
