import { AppModule } from '../src/app.module';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto/auth.dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prispaService: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3334);

    prispaService = app.get(PrismaService);
    await prispaService.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3334');
  });

  afterAll(() => {
    app.close();
  });
  //it.todo('should pass');
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test1@mail.com',
      password: '1234',
    };
    describe('Sign up', () => {
      it('should throw if password empty', () => {
        return pactum
                .spec()
                .post('/auth/signup')
                .withBody({
                  email: dto.email
                })
                .expectStatus(400)
      });
      it('should throw if email empty', () => {
        return pactum
                .spec()
                .post('/auth/signup')
                .withBody({
                  password: dto.password
                })
                .expectStatus(400)
      });
      it('should throw if body empty', () => {
        return pactum
                .spec()
                .post('/auth/signup')
                .withBody({})
                .expectStatus(400)
      });
      it('should signup', () => {
        return pactum
                .spec()
                .post('/auth/signup')
                .withBody(dto)
                .expectStatus(201)
                .inspect();
      });
    });
    describe('Signin', () => {
      it('should throw if password empty', () => {
        return pactum
                .spec()
                .post('/auth/signin')
                .withBody({
                  email: dto.email
                })
                .expectStatus(400)
      });
      it('should throw if email empty', () => {
        return pactum
                .spec()
                .post('/auth/signin')
                .withBody({
                  password: dto.password
                })
                .expectStatus(400)
      });
      it('should throw if body empty', () => {
        return pactum
                .spec()
                .post('/auth/signin')
                .withBody({})
                .expectStatus(400)
      });
      it('should signin', () => {
        return pactum
                .spec()
                .post('/auth/signin')
                .withBody(dto)
                .expectStatus(200)
                .stores('accessToken', 'access_token')
                .inspect();
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
                .spec()
                .get('/user/me')
                .withHeaders({
                  Authorization: 'Bearer $S{accessToken}',
                })
                .expectStatus(200)
                .inspect();
      });
    });
    describe('Edit user', () => {});
  });

  describe('Bookmarks', () => {
    describe('Create bookmark', () => {});
    describe('Get bookmarks', () => {});
    describe('Get bookmark by id', () => {});
    describe('Edit bookmark by id', () => {});
    describe('Delete bookmark by id', () => {});
  });
});
