import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FaCalendar, FaUser } from 'react-icons/fa';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { Header } from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  id: string;
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState(next_page);

  const handleLoadPosts = (): void => {
    if (!next_page) {
      return;
    }

    fetch(next_page, { method: 'GET' })
      .then(async response => {
        const json = await response.json();

        const formattedPosts: Post[] = json.results.map(result => {
          return {
            id: result.id,
            uid: result.uid,
            first_publication_date: format(
              new Date(result.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              author: result.data.author,
              subtitle: result.data.subtitle,
              title: result.data.title,
            },
          };
        });

        setNextPage(json.next_page);
        setPosts([...posts, ...formattedPosts]);
      })
      // eslint-disable-next-line no-console
      .catch(error => console.log('Erro ao carregar mais posts', error));
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.content}>
          <ul>
            {posts.map(post => (
              <li key={post.id} className={styles.post}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <section>
                      <span>
                        <FaCalendar size={20} color="#BBBBBB" />
                        {post.first_publication_date}
                      </span>
                      <span>
                        <FaUser size={20} color="#BBBBBB" />
                        {post.data.author}
                      </span>
                    </section>
                  </a>
                </Link>
              </li>
            ))}
          </ul>

          {nextPage && (
            <button
              type="button"
              className={styles.load}
              onClick={handleLoadPosts}
            >
              <strong>carregar mais posts</strong>
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 20,
    }
  );

  const posts: Post[] = response.results.map(result => {
    return {
      id: result.id,
      uid: result.uid,
      first_publication_date: format(
        new Date(result.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        author: result.data.author,
        subtitle: result.data.subtitle,
        title: result.data.title,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: response.next_page,
      },
    },
    revalidate: 60 * 60, // 1 hora
  };
};
